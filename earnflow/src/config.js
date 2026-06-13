// --- CONFIGURACIÓN DE URL ---
const getApiUrl = () => {
  const hostname = window.location.hostname;

  // Si estamos en producción (ej: Render, Vercel)
  // O en cualquier IP externa que no sea localhost o IPs locales comunes
  if (
    import.meta.env.PROD ||
    (!hostname.includes('localhost') &&
     !hostname.includes('127.0.0.1') &&
     !hostname.startsWith('172.') &&
     !hostname.startsWith('192.168.'))
  ) {
    // Si el frontend se sirve desde el mismo servidor que la API (o en producción)
    return ''; 
  }

  // Si estamos en el navegador del celular usando la IP local (red de celular 172.x o red local 192.168.x)
  if (
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1' &&
    (hostname.startsWith('172.') || hostname.startsWith('192.168.'))
  ) {
    return `http://${hostname}:3001`;
  }
  
  // Por defecto (Localhost)
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();
