import React from "react";
import ReactDOMServer from "react-dom/server";
import {
	createStaticHandler,
	createStaticRouter,
	// @ts-expect-error - SSR module not resolved in browser context
	StaticRouterProvider,
} from "react-router-dom/server";
import routes from "./routes.tsx";

export default async function handleRequest(request: Request) {
	const handler = createStaticHandler(routes);
	const context = await handler.query(request);

	if (context instanceof Response) {
		return context;
	}

	const router = createStaticRouter(handler.dataRoutes, context);

	const stream = await ReactDOMServer.renderToReadableStream(
		<React.StrictMode>
			<StaticRouterProvider
				router={router}
				context={context}
				nonce="the-nonce"
			/>
		</React.StrictMode>,
		{
			bootstrapScripts: ["/app/entry.client.tsx"],
			onError(error) {
				console.error(error);
			},
		},
	);

	return new Response(stream, {
		headers: { "Content-Type": "text/html" },
	});
}
