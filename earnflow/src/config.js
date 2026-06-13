// --- CONFIGURACIÓN DE URL ---
const getApiUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // Si estamos en producción (ej: Render, Vercel)
  // Generalmente servimos el frontend y backend desde el mismo sitio
  if (process.env.NODE_ENV === 'production' || !hostname.includes('localhost') && !hostname.includes('172.20')) {
    // Si el frontend se sirve desde el mismo servidor que la API
    return ''; 
  }

  // Si estamos en el navegador del celular usando la IP local
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname.startsWith('172.')) {
    return `http://${hostname}:3001`;
  }
  
  // Por defecto (Localhost)
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();
