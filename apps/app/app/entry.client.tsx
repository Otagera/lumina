import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

const router = createBrowserRouter(routes);

const rootElement = document.getElementById("root");
if (rootElement) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { staleTime: 60 * 1000 },
		},
	});

	createRoot(rootElement).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</StrictMode>,
	);
}


registerSW({ immediate: true });
