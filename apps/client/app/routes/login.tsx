import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { joinAlbum } from "../utils/api";
import { useAuth } from "../utils/auth";

const LoginPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const { login, isAuthenticated, isInitialized } = useAuth();

	const redirectParam = searchParams.get("redirect");
	const pendingJoinToken = sessionStorage.getItem("pendingJoinToken");

	useEffect(() => {
		if (!isInitialized) return;

		const completePendingJoin = async () => {
			if (pendingJoinToken) {
				sessionStorage.removeItem("pendingJoinToken");
				try {
					const res = await joinAlbum(pendingJoinToken);
					if (res.status === "completed") {
						toast.success("You joined the album!");
						navigate(`/album/${res.data.albumId}`);
						return true;
					}
				} catch {
					// Continue to home if join fails
				}
			}
			navigate(redirectParam || "/home", { replace: true });
			return false;
		};

		if (isAuthenticated) {
			completePendingJoin();
		} else if (redirectParam?.startsWith("/join/")) {
			const token = redirectParam.replace("/join/", "");
			sessionStorage.setItem("pendingJoinToken", token);
		}
	}, [
		isInitialized,
		isAuthenticated,
		navigate,
		redirectParam,
		pendingJoinToken,
	]);

	const mutation = useMutation({
		mutationFn: login,
		onSuccess: async () => {
			toast.success("Welcome back!");

			if (pendingJoinToken) {
				sessionStorage.removeItem("pendingJoinToken");
				try {
					const res = await joinAlbum(pendingJoinToken);
					if (res.status === "completed") {
						navigate(`/album/${res.data.albumId}`);
						return;
					}
				} catch {
					// Continue to home
				}
			}

			navigate(redirectParam || "/home");
		},
		onError: (error: any) => {
			toast.error(error.message || "Login failed. Please try again.");
		},
	});

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!email || !password) {
			toast.error("Please fill in all fields");
			return;
		}
		mutation.mutate({ email, password });
	};

	return (
		<div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-sage/10 blur-[120px] rounded-full" />
				<div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-plum/10 blur-[120px] rounded-full" />
			</div>

			<div className="w-full max-w-md relative">
				<div className="glass-panel p-8 rounded-3xl space-y-8">
					<div className="text-center space-y-2">
						<h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
							Welcome <span className="text-sage">Back</span>
						</h1>
						<p className="text-zinc-500 dark:text-zinc-400 font-medium">
							Please enter your details to sign in
						</p>
					</div>

					<form className="space-y-5" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
								Email Address
							</label>
							<input
								type="email"
								placeholder="name@example.com"
								className="input-soft"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between items-center ml-1">
								<label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
									Password
								</label>
								<Link
									to="/forgot-password"
									className="text-xs font-bold text-sage hover:text-sage/80 transition-colors"
								>
									Forgot Password?
								</Link>
							</div>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									placeholder="••••••••"
									className="input-soft pr-12"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-sage transition-colors cursor-pointer"
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? (
										<svg
											className="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
											/>
										</svg>
									) : (
										<svg
											className="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									)}
								</button>
							</div>
						</div>

						<button
							type="submit"
							className="w-full py-4 px-6 btn-primary flex items-center justify-center space-x-2"
							disabled={mutation.isPending}
						>
							{mutation.isPending ? (
								<>
									<svg
										className="animate-spin h-5 w-5 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									<span>Signing in...</span>
								</>
							) : (
								"Sign In"
							)}
						</button>
					</form>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-transparent px-2 text-zinc-500 dark:text-zinc-400 font-bold">
								Or continue with
							</span>
						</div>
					</div>

					<p className="text-center text-sm text-zinc-600 dark:text-zinc-400 font-medium">
						New here?{" "}
						<Link
							to="/signup"
							className="text-sage hover:text-sage/80 font-bold underline decoration-2 underline-offset-4 transition-colors"
						>
							Create an account
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
