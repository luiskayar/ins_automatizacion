import { generarRequestOptions } from "./generarRequestOptions";

async function LoginApp(username, password) {
  const urlencoded = new URLSearchParams();
  urlencoded.append("V_s_Usuario", username);
  urlencoded.append("V_s_Password", password);
  urlencoded.append("v_l_Aplicacion", "1");
  urlencoded.append("v_l_IntentosPosibles", "3"); // Valor hardcoded
  urlencoded.append("v_l_NumIntento", "3"); // Valor hardcoded

  return await generarRequestOptions(
    "POST",
    urlencoded,
    "follow",
    "/api/login"
  );
}

export { LoginApp };
