import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import routes from "./routes.tsx";
import "./index.css";

registerSW({ immediate: true });

const router = createBrowserRouter(routes);

ReactDOM.hydrateRoot(
	document.getElementById("root")!,
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>,
);
