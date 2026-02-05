"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
// Importar LoginApp del web service (ajusta la ruta según donde tengas los archivos)
import { LoginApp } from "@/api/loginApi"; // o "../api/loginApi" según tu estructura

export default function LoginPage() {
	const router = useRouter();
	const { login } = useAuth();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleLogin(e?: React.FormEvent) {
		if (e) e.preventDefault();

		setLoading(true);
		setError(null);

		// Obtener valores del formulario o del estado
		const form = e?.target as HTMLFormElement | undefined;
		const formData = form ? new FormData(form) : undefined;
		const usernameValue = username || (formData?.get("username") as string) || "";
		const passwordValue = password || (formData?.get("password") as string) || "";

		// Validar que se ingresaron usuario y contraseña
		if (!usernameValue || !passwordValue) {
			setError("Por favor ingrese usuario y contraseña");
			setLoading(false);
			return;
		}

		try {
			let token = "";
			let authUser = "";
			let authN8nCode = "";

			// 1. Intentar autenticación interna (.env.local)
			const envCheck = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: usernameValue, password: passwordValue }),
			});

			if (envCheck.ok) {
				const envData = await envCheck.json();
				token = envData.token;
				authUser = envData.user;
				authN8nCode = envData.n8nCode;
			} else {
				// 2. Si falla interna, intentar Webservice

				// Llamar al web service usando LoginApp
				const result = await LoginApp(usernameValue, passwordValue);

				let responseData;

				// Parsear respuesta del Webservice
				if (typeof result === 'string') {
					try {
						responseData = JSON.parse(result);
					} catch {
						responseData = result;
					}
				} else if (result && typeof result === 'object' && result.data) {
					responseData = result.data;
				} else {
					responseData = result;
				}

				const {
					Pp_l_IdUsuario,
					Pp_s_Usuario,
					Pp_s_Error,
				} = responseData;

				// Verificar si hay error en la respuesta del Webservice
				if (Pp_s_Error !== null && Pp_s_Error !== undefined) {
					setError(
						Pp_s_Error === "Usuario bloqueado por intentos fallidos."
							? "Usuario bloqueado por intentos fallidos"
							: Pp_s_Error || "Error de autenticación"
					);
					setLoading(false);
					return;
				}

				// Login Webservice exitoso
				token = responseData.token || JSON.stringify({ id: Pp_l_IdUsuario, username: Pp_s_Usuario });
				authUser = Pp_s_Usuario || usernameValue;

				// CRITICAL: Asignar URL de webhook específica para usuarios de Webservice (no .env)
				authN8nCode = "https://delphos.deinsa.com:5678/webhook/excel-data";
			}

			// Completar login con los datos obtenidos (sea de Env o Webservice)
			login(token, {
				user: authUser,
				n8nCode: authN8nCode
			});

			router.push("/dashboard");

		} catch (error: unknown) {
			console.error("Error en login:", error);
			const errorMessage = error instanceof Error ? error.message : "No se pudo iniciar sesión. Intente nuevamente.";
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-neutral-900">
			<div className="relative w-full max-w-md p-8 bg-neutral-800/80 rounded-lg shadow-lg backdrop-blur-2xl">
				<div className="absolute inset-0 bg-[url('/imagen/delphoscolor.svg')] bg-no-repeat bg-center bg-[length:250px_300px] opacity-30"></div>

				<h1 className="text-center text-6xl text-white pb-20">Delphos</h1>

				<form onSubmit={handleLogin} suppressHydrationWarning className="relative z-10 space-y-6">
					{error && (
						<div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded">
							{error}
						</div>
					)}

					<div>
						<label className="block text-sm font-medium text-white"></label>
						<input
							type="text"
							name="username"
							placeholder="Usuario"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							className="w-full bg-transparent border-0 border-b-2 border-white text-white placeholder-white/60 px-2 py-2 focus:outline-none focus:border-white/80"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-white"></label>
						<input
							type="password"
							name="password"
							placeholder="Contraseña"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full bg-transparent border-0 border-b-2 border-white text-white placeholder-white/60 px-2 py-2 focus:outline-none focus:border-white/80"
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-[#0A84FF] text-white py-3 rounded-lg hover:brightness-110 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? "Iniciando sesión..." : "Iniciar sesión"}
					</button>
				</form>

				<div className="mt-6 text-center relative z-10">
					<a href="#" className="inline-block h-5 align-middle" aria-label="Olvidó su contraseña">&nbsp;</a>
					<div className="mt-4 h-6" aria-hidden="true"></div>
				</div>
			</div>
		</div>
	);
}