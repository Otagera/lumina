import { Component, type ReactNode } from "react";
import { Button } from "./Button";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: undefined });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="min-h-[400px] flex items-center justify-center p-8">
					<div className="text-center max-w-md">
						<div className="w-16 h-16 mx-auto mb-6 rounded-full bg-plum/10 dark:bg-rose-500/15 flex items-center justify-center">
							<svg
								className="w-8 h-8 text-plum dark:text-rose-300"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
							Something went wrong
						</h2>
						<p className="text-zinc-500 dark:text-zinc-400 mb-6">
							{this.state.error?.message || "An unexpected error occurred"}
						</p>
						<div className="flex gap-3 justify-center">
							<Button onClick={this.handleReset}>Try Again</Button>
							<Button variant="ghost" onClick={() => window.location.reload()}>
								Reload Page
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

interface AsyncErrorBoundaryProps {
	children: ReactNode;
	onError?: (error: Error) => void;
}

interface AsyncErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export class AsyncErrorBoundary extends Component<
	AsyncErrorBoundaryProps,
	AsyncErrorBoundaryState
> {
	constructor(props: AsyncErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): AsyncErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("AsyncErrorBoundary caught:", error, errorInfo);
		this.props.onError?.(error);
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-card border border-red-200 dark:border-red-800">
					<div className="flex items-start gap-4">
						<div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
							<svg
								className="w-5 h-5 text-red-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div className="flex-1">
							<h3 className="font-semibold text-red-900 dark:text-red-200">
								Failed to load
							</h3>
							<p className="text-sm text-red-700 dark:text-red-300 mt-1">
								{this.state.error?.message || "An error occurred"}
							</p>
							<Button
								size="sm"
								variant="ghost"
								onClick={this.handleRetry}
								className="mt-3 text-red-600 hover:text-red-700 dark:text-red-400"
							>
								Try Again
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
