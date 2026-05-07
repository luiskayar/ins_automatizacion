import { generarRequestOptions } from "./generarRequestOptions";

async function ParametrosApp(filtrarporcorreo) {
    const urlencoded = new URLSearchParams();
    urlencoded.append("v_b_FiltrarXCorreos", filtrarporcorreo);

    return await generarRequestOptions(
        "POST",
        urlencoded,
        "follow",
        "/api/parametros"
    );
}

export { ParametrosApp };
