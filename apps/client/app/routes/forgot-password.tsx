import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { forgotPassword } from "../utils/api";

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!email) {
			toast.error("Please enter your email address");
			return;
		}

		setIsLoading(true);
		try {
			await forgotPassword(email);
			setIsSubmitted(true);
			toast.success("Reset link sent to your email!");
		} catch (error: any) {
			toast.error(
				error.response?.data?.message ||
					"Something went wrong. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

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
							Reset <span className="text-sage">Password</span>
						</h1>
						<p className="text-zinc-500 dark:text-zinc-400 font-medium">
							{isSubmitted
								? "Check your email for the reset link"
								: "Enter your email to receive a reset link"}
						</p>
					</div>

					{!isSubmitted ? (
						<form className="space-y-6" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">
									Email Address
								</label>
								<input
									type="email"
									placeholder="name@example.com"
									className="w-full px-5 py-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all dark:text-white placeholder:text-zinc-400"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
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
										<span>Sending link...</span>
									</>
								) : (
									"Send Reset Link"
								)}
							</button>
						</form>
					) : (
						<div className="bg-sage/10 dark:bg-sage/20 p-6 rounded-2xl border border-sage/20 dark:border-sage/50 text-center space-y-4">
							<div className="w-12 h-12 bg-sage text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-sage/20">
								<svg
									className="w-6 h-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<p className="text-zinc-700 dark:text-zinc-300 font-medium">
								We've sent a password reset link to{" "}
								<span className="font-bold text-sage">{email}</span>. Please
								check your inbox.
							</p>
							<button
								onClick={() => setIsSubmitted(false)}
								className="text-sm font-bold text-sage hover:text-sage/80 transition-colors"
							>
								Didn't receive it? Try again
							</button>
						</div>
					)}

					<div className="pt-4 text-center">
						<Link
							to="/login"
							className="text-zinc-500 hover:text-sage font-bold transition-colors flex items-center justify-center space-x-2"
						>
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								/>
							</svg>
							<span>Back to Sign In</span>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ForgotPasswordPage;
