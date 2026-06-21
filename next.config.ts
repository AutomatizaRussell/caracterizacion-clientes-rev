import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Genera una salida autocontenida para Docker:
   * .next/standalone
   *
   * Esto reduce lo que se copia al contenedor final y evita cargar node_modules
   * completo en runtime. Es el modo correcto para Coolify/Docker productivo.
   */
  output: "standalone",

  /**
   * Evita exponer cabecera X-Powered-By.
   * No cambia rendimiento, pero reduce ruido superficial.
   */
  poweredByHeader: false,
};

export default nextConfig;