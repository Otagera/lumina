import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "~/components/standard/Input";
import { useAuth } from "../utils/auth";

const SignupPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const { signup, isAuthenticated, isInitialized } = useAuth();

	useEffect(() => {
		if (isInitialized && isAuthenticated) {
			navigate("/home", { replace: true });
		}
	}, [isInitialized, isAuthenticated, navigate]);

	const mutation = useMutation({
		mutationFn: signup,
		onSuccess: () => {
			const referrer = searchParams.get("referrer");
			if (referrer?.startsWith("guest_event_")) {
				window.dispatchEvent(
					new CustomEvent("lumina:analytics", {
						detail: {
							event: "guest_host_cta_conversion",
							referrer,
							token: searchParams.get("token"),
							albumId: searchParams.get("albumId"),
						},
					}),
				);
			}
			localStorage.setItem("lumina:first-signup-guide", "show");
			toast.success("Account created successfully!");
			navigate("/home");
		},
		onError: (error: any) => {
			toast.error(error.message || "Signup failed. Please try again.");
		},
	});

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!email || !password || !confirmPassword) {
			toast.error("Please fill in all fields");
			return;
		}
		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
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
							Create <span className="text-sage">Account</span>
						</h1>
						<p className="text-zinc-500 dark:text-zinc-400 font-medium">
							Join us and start matching faces
						</p>
					</div>

					<form className="space-y-6" onSubmit={handleSubmit}>
						<Input
							type="email"
							label="Email Address"
							placeholder="name@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>

						<Input
							type={showPassword ? "text" : "password"}
							label="Password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							trailing={
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="p-1 text-zinc-400 hover:text-sage transition-colors cursor-pointer"
									aria-label={
										showPassword ? "Hide password" : "Show password"
									}
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							}
						/>

						<Input
							type={showConfirmPassword ? "text" : "password"}
							label="Confirm Password"
							placeholder="••••••••"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							trailing={
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="p-1 text-zinc-400 hover:text-sage transition-colors cursor-pointer"
									aria-label={
										showConfirmPassword
											? "Hide password"
											: "Show password"
									}
								>
									{showConfirmPassword ? (
										<EyeOff size={18} />
									) : (
										<Eye size={18} />
									)}
								</button>
							}
						/>

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
									<span>Creating account...</span>
								</>
							) : (
								"Create Account"
							)}
						</button>
					</form>

					<div className="flex items-center gap-3">
						<div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
						<span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
							Or join with
						</span>
						<div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
					</div>

					<p className="text-center text-sm text-zinc-600 dark:text-zinc-400 font-medium">
						Already have an account?{" "}
						<Link
							to="/login"
							className="text-sage hover:text-sage/80 font-bold underline decoration-2 underline-offset-4 transition-colors"
						>
							Sign in here
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default SignupPage;
