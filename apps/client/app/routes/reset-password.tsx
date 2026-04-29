import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../utils/api";

const ResetPasswordPage = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!token) {
			toast.error("Invalid reset link");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		setIsLoading(true);
		try {
			await resetPassword({ token, password });
			toast.success("Password reset successfully!");
			navigate("/login");
		} catch (error: any) {
			toast.error(
				error.response?.data?.message ||
					"Failed to reset password. The link may have expired.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (!token) {
		return (
			<div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-4">
				<div className="text-center space-y-4">
					<h1 className="text-2xl font-bold">Invalid Reset Link</h1>
					<p>This link is invalid or has expired.</p>
					<Link
						to="/forgot-password"
						title="Forgot Password"
						className="text-sage font-bold"
					>
						Request a new link
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-sage/10 blur-[120px] rounded-full" />
				<div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-plum/10 blur-[120px] rounded-full" />
			</div>

			<div className="w-full max-w-md relative">
				<div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 space-y-8">
					<div className="text-center space-y-2">
						<h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
							New <span className="text-sage">Password</span>
						</h1>
						<p className="text-zinc-500 dark:text-zinc-400 font-medium">
							Create a secure password for your account
						</p>
					</div>

					<form className="space-y-6" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
								New Password
							</label>
							<input
								type="password"
								placeholder="••••••••"
								className="w-full px-5 py-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all dark:text-white"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
								Confirm New Password
							</label>
							<input
								type="password"
								placeholder="••••••••"
								className="w-full px-5 py-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all dark:text-white"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
							/>
						</div>

						<button
							type="submit"
							className="w-full py-4 px-6 bg-sage hover:bg-sage/90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sage/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center space-x-2"
							disabled={isLoading}
						>
							{isLoading ? (
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
									<span>Resetting...</span>
								</>
							) : (
								"Reset Password"
							)}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default ResetPasswordPage;
