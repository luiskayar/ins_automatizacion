async function obtenerToken() {
  console.log('Iniciando obtención de token...');
  const requestOptions = {
    method: "GET",
    redirect: "follow",
  };

  try {
    console.log('Realizando petición a /api/tokenSistema');
    const response = await fetch("/api/tokenSistema", requestOptions);
    console.log('Respuesta recibida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const text = await response.text();
    console.log('Token recibido:', text.substring(0, 50) + '...');
    return text;
  } catch (error) {
    console.error('Error al obtener token:', error);
    throw error;
  }
}

export { obtenerToken };
