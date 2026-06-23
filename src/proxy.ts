import { NextResponse, type NextRequest } from "next/server";

/**
 * Basic Auth temporal para proteger la app interna desplegada.
 *
 * Alcance:
 * - No reemplaza login real.
 * - No gestiona sesiones por usuario.
 * - No diferencia roles.
 * - Solo evita navegación pública casual mientras el prototipo está expuesto.
 *
 * La selección de empleado dentro de /login sigue siendo una simulación
 * funcional para probar alcances, clientes visibles y flujos internos.
 */
const BASIC_AUTH_REALM =
  process.env.BASIC_AUTH_REALM?.trim() || "Plataforma Impulsa";

const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER?.trim() || "";
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || "";

type BasicCredentials = {
  username: string;
  password: string;
};

function unauthorizedResponse() {
  return new NextResponse("Autenticación requerida.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`,
    },
  });
}

function decodeBasicAuthHeader(
  authorizationHeader: string | null,
): BasicCredentials | null {
  if (!authorizationHeader?.startsWith("Basic ")) {
    return null;
  }

  const encodedCredentials = authorizationHeader.slice("Basic ".length).trim();

  try {
    const decodedCredentials = atob(encodedCredentials);
    const separatorIndex = decodedCredentials.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decodedCredentials.slice(0, separatorIndex),
      password: decodedCredentials.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  /**
   * Fail closed en producción:
   * si se activa el despliegue sin credenciales, la app interna no queda pública.
   */
  if (!BASIC_AUTH_USER || !BASIC_AUTH_PASSWORD) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Basic Auth no configurado.", {
        status: 500,
      });
    }

    return NextResponse.next();
  }

  const credentials = decodeBasicAuthHeader(
    request.headers.get("authorization"),
  );

  const isAuthorized =
    credentials?.username === BASIC_AUTH_USER &&
    credentials.password === BASIC_AUTH_PASSWORD;

  if (!isAuthorized) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /**
     * Protege la app interna, pero evita romper:
     * - assets internos de Next;
     * - portal cliente público;
     * - rutas API/webhooks.
     *
     * Si más adelante quieres proteger también /api internas, no uses un
     * matcher global a ciegas: separa webhooks públicos de APIs privadas.
     */
    "/((?!_next/static|_next/image|rb-logo.png|favicon.ico|robots.txt|sitemap.xml|portal-cliente|api).*)",
  ],
};
