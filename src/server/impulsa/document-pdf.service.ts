import "server-only";

import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";

type GenerateSolicitudPdfInput = {
  html: string;
};

/**
 * Variables de entorno soportadas:
 *
 * PDF_BROWSER_IDLE_TIMEOUT_MS
 * - Tiempo en milisegundos que Chromium permanece vivo después de la última
 *   generación de PDF.
 * - Valor recomendado inicial: 60000.
 * - Si se define en 0, Chromium se cierra inmediatamente después de cada PDF.
 *
 * PDF_RENDER_TIMEOUT_MS
 * - Timeout máximo para operaciones de renderizado/carga de HTML.
 * - Valor recomendado inicial: 30000.
 */

/**
 * Tiempo por defecto para mantener Chromium vivo después de la última generación.
 *
 * Razón:
 * - Lanzar Chromium por cada PDF es costoso.
 * - Dejar Chromium vivo indefinidamente consume memoria en idle.
 * - Este timeout permite reutilizar el browser para solicitudes cercanas y
 *   cerrarlo automáticamente cuando queda inactivo.
 */
const DEFAULT_BROWSER_IDLE_TIMEOUT_MS = 60_000;

/**
 * Timeout defensivo para operaciones de renderizado.
 *
 * No es una "restricción para esconder problemas"; evita que una página/PDF
 * defectuoso deje Playwright esperando indefinidamente y bloquee la cola.
 */
const DEFAULT_RENDER_TIMEOUT_MS = 30_000;

/**
 * Referencia al browser real ya inicializado.
 *
 * Se mantiene separada de browserPromise para distinguir entre:
 * - instancia ya lista;
 * - inicialización en curso;
 * - estado limpio después de cierre/error.
 */
let browserInstance: Browser | null = null;

/**
 * Promesa de inicialización del browser.
 *
 * Evita carreras cuando dos solicitudes intentan iniciar Chromium al mismo
 * tiempo. Aunque la generación PDF se serializa, esta separación protege el
 * flujo ante cambios futuros o llamadas internas concurrentes.
 */
let browserPromise: Promise<Browser> | null = null;

/**
 * Timer de cierre automático por inactividad.
 */
let idleCloseTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Cola simple para serializar generaciones PDF.
 *
 * Motivo:
 * Chromium/Playwright es el recurso más pesado de este flujo. Permitir varias
 * generaciones simultáneas puede abrir múltiples contextos/procesos y disparar
 * memoria. Serializar PDFs evita picos destructivos sin degradar el rendimiento
 * real esperado para esta app.
 */
let pdfQueue: Promise<unknown> = Promise.resolve();

/**
 * Lee una variable de entorno numérica que admite cero.
 *
 * Uso:
 * - PDF_BROWSER_IDLE_TIMEOUT_MS puede ser 0 para cerrar Chromium inmediatamente.
 */
function getNonNegativeIntegerEnv(name: string, defaultValue: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return defaultValue;
  }

  return Math.floor(parsedValue);
}

/**
 * Lee una variable de entorno numérica estrictamente positiva.
 *
 * Uso:
 * - PDF_RENDER_TIMEOUT_MS no debe ser 0 porque eso eliminaría el timeout útil
 *   de seguridad durante el renderizado.
 */
function getPositiveIntegerEnv(name: string, defaultValue: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return defaultValue;
  }

  return Math.floor(parsedValue);
}

function getBrowserIdleTimeoutMs() {
  return getNonNegativeIntegerEnv(
    "PDF_BROWSER_IDLE_TIMEOUT_MS",
    DEFAULT_BROWSER_IDLE_TIMEOUT_MS,
  );
}

function getRenderTimeoutMs() {
  return getPositiveIntegerEnv(
    "PDF_RENDER_TIMEOUT_MS",
    DEFAULT_RENDER_TIMEOUT_MS,
  );
}

function clearIdleCloseTimer() {
  if (!idleCloseTimer) {
    return;
  }

  clearTimeout(idleCloseTimer);
  idleCloseTimer = null;
}

/**
 * Cierra Chromium y limpia referencias globales.
 *
 * Este método debe ser tolerante a errores porque se llama desde timers y
 * bloques de limpieza. Si Chromium ya se cayó, no debe tumbar el proceso Next.
 */
async function closeBrowser(reason: string) {
  clearIdleCloseTimer();

  const browser = browserInstance;

  browserInstance = null;
  browserPromise = null;

  if (!browser) {
    return;
  }

  if (!browser.isConnected()) {
    return;
  }

  try {
    await browser.close();
  } catch (error) {
    console.error("[PDF] Error cerrando Chromium.", {
      reason,
      error,
    });
  }
}

/**
 * Programa el cierre automático de Chromium cuando queda inactivo.
 *
 * Si PDF_BROWSER_IDLE_TIMEOUT_MS=0:
 * - Chromium se cierra inmediatamente después de cada generación.
 *
 * Si PDF_BROWSER_IDLE_TIMEOUT_MS>0:
 * - Chromium queda vivo durante ese tiempo para reutilizarse en PDFs cercanos.
 */
function scheduleIdleBrowserClose() {
  clearIdleCloseTimer();

  const idleTimeoutMs = getBrowserIdleTimeoutMs();

  idleCloseTimer = setTimeout(() => {
    void closeBrowser("idle-timeout");
  }, idleTimeoutMs);

  /**
   * `unref` evita que el timer mantenga vivo el proceso Node por sí solo.
   * En Node existe; se protege por compatibilidad de tipos/runtime.
   */
  idleCloseTimer.unref?.();
}

/**
 * Ejecuta una tarea dentro de una cola serial.
 *
 * La cola nunca debe quedar rota si una generación falla. Por eso, después de
 * cada ejecución, se captura el error internamente para que el siguiente trabajo
 * pueda continuar.
 */
async function runPdfTaskSerialized<T>(task: () => Promise<T>): Promise<T> {
  const run = pdfQueue.then(task, task);

  pdfQueue = run.catch(() => undefined);

  return run;
}

/**
 * Inicializa o reutiliza Chromium.
 *
 * Reglas:
 * - Si existe un browser conectado, se reutiliza.
 * - Si hay una inicialización en curso, se espera esa promesa.
 * - Si Chromium falla al iniciar o se desconecta, se limpian referencias para
 *   permitir reintento en la siguiente generación.
 */
async function getBrowser() {
  clearIdleCloseTimer();

  if (browserInstance?.isConnected()) {
    return browserInstance;
  }

  if (!browserPromise) {
    browserPromise = chromium
      .launch({
        headless: true,
        args: [
          /**
           * Necesario en contenedores Linux sin sandbox configurado.
           */
          "--no-sandbox",
          "--disable-setuid-sandbox",

          /**
           * Evita depender de /dev/shm, que suele ser pequeño en Docker.
           */
          "--disable-dev-shm-usage",
        ],
      })
      .then((browser) => {
        browserInstance = browser;

        browser.on("disconnected", () => {
          if (browserInstance === browser) {
            browserInstance = null;
          }

          browserPromise = null;
          clearIdleCloseTimer();
        });

        return browser;
      })
      .catch((error) => {
        browserInstance = null;
        browserPromise = null;
        clearIdleCloseTimer();

        throw error;
      });
  }

  return browserPromise;
}

async function closePageSafely(page: Page | null) {
  if (!page) {
    return;
  }

  try {
    if (!page.isClosed()) {
      await page.close();
    }
  } catch (error) {
    console.error("[PDF] Error cerrando página Playwright.", {
      error,
    });
  }
}

async function closeContextSafely(context: BrowserContext | null) {
  if (!context) {
    return;
  }

  try {
    await context.close();
  } catch (error) {
    console.error("[PDF] Error cerrando contexto Playwright.", {
      error,
    });
  }
}

/**
 * Genera PDF real desde el HTML canónico.
 *
 * Diseño:
 * - Usa Chromium real para fidelidad visual.
 * - Serializa generaciones para evitar picos de memoria.
 * - Crea un contexto aislado por PDF.
 * - Cierra page/context siempre.
 * - Mantiene browser vivo solo por un tiempo corto de inactividad.
 */
export async function generateSolicitudPdfFromHtml({
  html,
}: GenerateSolicitudPdfInput): Promise<Buffer> {
  return runPdfTaskSerialized(async () => {
    const browser = await getBrowser();
    const renderTimeoutMs = getRenderTimeoutMs();

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    /**
     * Si la generación falla, el browser puede quedar en estado inconsistente.
     * No se cierra inmediatamente en el catch porque primero queremos cerrar
     * page/context en el finally. Luego se cierra Chromium.
     */
    let shouldCloseBrowserAfterCleanup = false;

    try {
      context = await browser.newContext({
        viewport: {
          width: 595,
          height: 842,
        },
      });

      context.setDefaultTimeout(renderTimeoutMs);
      context.setDefaultNavigationTimeout(renderTimeoutMs);

      page = await context.newPage();

      await page.setContent(html, {
        waitUntil: "networkidle",
        timeout: renderTimeoutMs,
      });

      await page.emulateMedia({
        media: "screen",
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      shouldCloseBrowserAfterCleanup = true;
      throw error;
    } finally {
      /**
       * El orden importa:
       * - primero page;
       * - luego context;
       * - si hubo error, se cierra Chromium completo;
       * - si no hubo error, se programa cierre por inactividad.
       */
      await closePageSafely(page);
      await closeContextSafely(context);

      if (shouldCloseBrowserAfterCleanup) {
        await closeBrowser("pdf-generation-error");
      } else if (browserInstance?.isConnected()) {
        scheduleIdleBrowserClose();
      }
    }
  });
}