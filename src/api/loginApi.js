import { generarRequestOptions } from "./generarRequestOptions";

async function LoginApp(username, password, numIntento = 1, intentosPosibles = 3) {
  const urlencoded = new URLSearchParams();
  urlencoded.append("V_s_Usuario", username);
  urlencoded.append("V_s_Password", password);
  urlencoded.append("v_l_Aplicacion", "1");
  urlencoded.append("v_l_IntentosPosibles", String(intentosPosibles));
  urlencoded.append("v_l_NumIntento", String(numIntento));

  return await generarRequestOptions(
    "POST",
    urlencoded,
    "follow",
    "/api/login"
  );
}

export { LoginApp };
