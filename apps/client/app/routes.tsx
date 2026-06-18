import type { RouteObject } from "react-router-dom";
import { Navigate, useParams } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import App, { ErrorBoundary as AppErrorBoundary } from "./root";
import Album from "./routes/album";
import ThemeEditor from "./routes/themeEditor";
import ForgotPassword from "./routes/forgot-password";
import Home from "./routes/home";
import JoinAlbum from "./routes/joinAlbum";
import Login from "./routes/login";
import NotFound from "./routes/not-found";
import People from "./routes/people";
import ResetPassword from "./routes/reset-password";
import Search from "./routes/search";
import Settings from "./routes/settings";
import SharedAlbum from "./routes/sharedAlbum";
import Slideshow from "./routes/slideshow";
import LiveDisplay from "./routes/liveDisplay";
import Signup from "./routes/signup";
import StylePreview from "./routes/style-preview";
import Trash from "./routes/trash";
import Usage from "./routes/usage";
import Welcome from "./welcome/Welcome";

const ETokenRedirect = () => {
	const { token } = useParams<{ token: string }>();
	return <Navigate to={`/share/${token}`} replace />;
};

export default [
	{
		path: "/",
		element: <App />,
		ErrorBoundary: AppErrorBoundary,
		children: [
			{
				index: true,
				element: <Welcome />,
			},
			{
				path: "login",
				element: <Login />,
			},
			{
				path: "signup",
				element: <Signup />,
			},
			{
				path: "forgot-password",
				element: <ForgotPassword />,
			},
			{
				path: "reset-password",
				element: <ResetPassword />,
			},
			{
				path: "e/:token",
				element: <ETokenRedirect />,
			},
			{
				path: "share/:token",
				element: <SharedAlbum />,
			},
			{
				path: "share/:token/slideshow",
				element: <Slideshow />,
			},
			{
				path: "share/:token/live",
				element: <LiveDisplay />,
			},
			{
				path: "join/:token",
				element: <JoinAlbum />,
			},
			...(import.meta.env.DEV
				? [
					{
						path: "style-preview",
						element: <StylePreview />,
					},
				]
				: []),
			{
				element: <PrivateRoute />,
				children: [
					{
						path: "home",
						element: <Home />,
					},
					{
						path: "album/:albumId",
						element: <Album />,
					},
					{
						path: "album/:albumId/theme",
						element: <ThemeEditor />,
					},
					{
						path: "search",
						element: <Search />,
					},
					{
						path: "people",
						element: <People />,
					},
					{
						path: "settings",
						element: <Settings />,
					},
					{
						path: "usage",
						element: <Usage />,
					},
					{
						path: "trash",
						element: <Trash />,
					},
				],
			},
			// Not found page
			{
				path: "not-found",
				element: <NotFound />,
			},
			// Catch-all 404 - must be last
			{
				path: "*",
				element: <NotFound />,
			},
		],
	},
] satisfies RouteObject[];
