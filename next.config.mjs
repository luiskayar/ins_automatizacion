import fs from 'fs';
import path from 'path';

let baseURL = process.env.API_BASE_URL;

try {
  const configPath = path.join(process.cwd(), 'public', 'config.js');
  const content = fs.readFileSync(configPath, 'utf-8');
  const match = content.match(/API_BASE_URL:\s*["']([^"']+)["']/);
  if (match) baseURL = match[1];
} catch {
  // sin config.js, usa process.env.API_BASE_URL
}




// Mapa de rutas para evitar repetir lógica
const apiRoutes = {
  login: "/LoginApp",
  tokenSistema: "/ObtenerAutoTK",
  parametros: "/Obtiene_ParametrosGenerales_App"
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
  async headers() {
    return [
      {
        source: '/config.js',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
  async rewrites() {
    return generateRewrites();
  },
};

export default nextConfig;
