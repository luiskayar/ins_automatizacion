"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { LoginApp } from "@/api/loginApi";
import { ParametrosApp } from "@/api/parametrosApi";

export default function LoginPage() {
	const router = useRouter();
	const { login } = useAuth();

	const [mounted, setMounted] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [numIntento, setNumIntento] = useState(1);
	const [intentosPosibles, setIntentosPosibles] = useState(3);

	useEffect(() => {
		setMounted(true);

		const fetchParametros = async () => {
			try {
				const result = await ParametrosApp(false);
				const intento_bloqueo = result?.data?.ParametrosGen?.find(
					(item: { PARAM: string }) => item.PARAM === "INTENTOS_BLOQUEO"
				);
				if (intento_bloqueo) {
					const valor = Number(intento_bloqueo.VALOR);
					if (!isNaN(valor) && valor > 0) setIntentosPosibles(valor);
				}
			}
			catch (error) {
				console.error("Error en login:", error);
			}
		}

		fetchParametros();
	}, []);

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
			const result = await LoginApp(usernameValue, passwordValue, numIntento, intentosPosibles);

			let responseData;

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

			const { Pp_l_IdUsuario, Pp_s_Usuario, Pp_s_Error } = responseData;

			if (Pp_s_Error !== null && Pp_s_Error !== undefined) {
				setNumIntento(prev => prev + 1);
				setError(
					Pp_s_Error === "Usuario bloqueado por intentos fallidos."
						? "Usuario bloqueado por intentos fallidos"
						: Pp_s_Error || "Error de autenticación"
				);
				setLoading(false);
				return;
			}

			const token = responseData.token || JSON.stringify({ id: Pp_l_IdUsuario, username: Pp_s_Usuario });
			const authUser = Pp_s_Usuario || usernameValue;
			const authN8nCode = "https://delphos.deinsa.com:5678/webhook/excel-data";

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

	if (!mounted) {
		return <div className="min-h-screen bg-neutral-900" />;
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-neutral-900">
			<div className="relative w-full max-w-md p-8 bg-neutral-800/80 rounded-lg shadow-lg backdrop-blur-2xl">
				<div className="absolute inset-0 bg-[url('/imagen/delphoscolor.svg')] bg-no-repeat bg-center bg-[length:250px_300px] opacity-30"></div>

				<h1 className="text-center text-6xl text-white pb-20">Delphos</h1>

				<form onSubmit={handleLogin} className="relative z-10 space-y-6">
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
							suppressHydrationWarning
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
							suppressHydrationWarning
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