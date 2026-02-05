const baseURL =
  "https://delphos.deinsa.com:8080/Delphos_N/wsdelphos/wsdelphos.asmx";
// "https://delphos.deinsa.com:82/Delphos_Alajuela/wsdelphos/wsdelphos.asmx";

// Mapa de rutas para evitar repetir lógica
const apiRoutes = {
  login: "/LoginApp",
  tokenSistema: "/ObtenerAutoTK"
};

// Generar las reescrituras dinámicamente
const generateRewrites = () => {
  return Object.keys(apiRoutes).map((key) => ({
    source: `/api/${key}`,              // Ruta interna en Next.js
    destination: `${baseURL}${apiRoutes[key]}`, // Web Service real
  }));
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      '/': [
        './node_modules/sharp/**/*',
      ],
    },
    outputFileTracingExcludes: {},
  },
  async rewrites() {
    return generateRewrites();
  },
};

export default nextConfig;
