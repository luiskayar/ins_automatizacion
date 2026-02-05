import { obtenerToken } from "./obtenerToken";

function extraerValorSiEsXML(xmlString) {
  try {
    if (!xmlString) {
      console.error("String XML vacío o undefined");
      return null;
    }

    // 🔥 Validación clave: si NO empieza con < entonces NO es XML
    const clean = xmlString.trim();
    if (!clean.startsWith("<")) {
      console.warn("⚠️ El contenido no parece XML. No se intentará parsear.");
      return null;
    }

    console.log(
      "Intentando parsear XML:",
      clean.substring(0, 100) + "..."
    );

    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, "application/xml");

    // Detectar errores internos del DOMParser
    if (doc.getElementsByTagName("parsererror").length > 0) {
      console.warn(
        "⛔ Error al parsear XML:",
        doc.getElementsByTagName("parsererror")[0].textContent
      );
      return null;
    }

    // Buscar <string xmlns="http://tempuri.org/">
    const stringElement = doc.getElementsByTagNameNS(
      "http://tempuri.org/",
      "string"
    )[0];

    if (stringElement) {
      console.log(
        "Valor extraído del XML:",
        stringElement.textContent.substring(0, 50) + "..."
      );
      return stringElement.textContent;
    }

    console.log("No se encontró la etiqueta <string>");
    return null;
  } catch (error) {
    console.error("Error al procesar el XML:", error);
    return null;
  }
}

async function generarRequestOptions(
  metodo,
  urlencoded,
  redireccionar,
  enlaceApi,
  tokenUsuario = null
) {
  try {
    let token;

    if (tokenUsuario) {
      console.log(
        "Usando token proporcionado por el usuario:",
        tokenUsuario.substring(0, 50) + "..."
      );

      if (
        tokenUsuario.includes("<?xml") ||
        tokenUsuario.includes("<string")
      ) {
        console.log("Token contiene XML, extrayendo valor...");
        token = extraerValorSiEsXML(tokenUsuario);

        if (!token) {
          console.error(
            "No se pudo extraer el token del XML proporcionado. Token original:",
            tokenUsuario
          );
          throw new Error("Token proporcionado contiene XML inválido");
        }
      } else {
        token = tokenUsuario;
      }
    } else {
      console.log("Obteniendo token automáticamente...");
      const solicitud = await obtenerToken();
      console.log(
        "Token obtenido (XML completo):",
        solicitud.substring(0, 50) + "..."
      );

      token = extraerValorSiEsXML(solicitud);

      if (!token) {
        console.error(
          "No se pudo extraer el token del XML. Respuesta completa:",
          solicitud
        );
        throw new Error(
          "No se pudo obtener el token de autenticación. Verifique que el servidor esté funcionando correctamente."
        );
      }
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    // Validación del token
    console.log("🔍 Validando token extraído:", {
      token,
      type: typeof token,
      isString: typeof token === "string",
      length: token?.length,
      trimmed: token?.trim(),
      isEmpty: token?.trim() === "",
      isValid: token && typeof token === "string" && token.trim() !== "",
    });

    if (token && typeof token === "string" && token.trim() !== "") {
      console.log("✔️ Token válido, agregando Authorization header");
      myHeaders.append("Authorization", "Bearer " + token);
    } else {
      console.warn("⚠️ Token inválido, omitiendo Authorization header");
    }

    console.log("Realizando petición a:", enlaceApi);

    const requestOptions = {
      method: metodo,
      headers: myHeaders,
      body: urlencoded,
      redirect: redireccionar,
    };

    const response = await fetch(enlaceApi, requestOptions);

    console.log("Respuesta recibida:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      throw new Error(
        `Error en la petición: ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();
    console.log(
      "Respuesta en texto:",
      text.substring(0, 100) + "..."
    );

    const datoXML = extraerValorSiEsXML(text);

    if (datoXML !== null) {
      return datoXML;
    } else {
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Error al parsear JSON:", e);
        throw new Error("Error al procesar la respuesta del servidor");
      }
    }
  } catch (error) {
    console.error("Error en generarRequestOptions:", error);
    throw error;
  }
}

export { generarRequestOptions };
