import type { RouteObject } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import App, { ErrorBoundary as AppErrorBoundary } from "./root";
import Album from "./routes/album";
import ForgotPassword from "./routes/forgot-password";
import Home from "./routes/home";
import JoinAlbum from "./routes/joinAlbum";
import Login from "./routes/login";
import People from "./routes/people";
import ResetPassword from "./routes/reset-password";
import Search from "./routes/search";
import Settings from "./routes/settings";
import SharedAlbum from "./routes/sharedAlbum";
import Signup from "./routes/signup";
import Trash from "./routes/trash";
import Usage from "./routes/usage";
import Welcome from "./welcome/Welcome";

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
				path: "share/:token",
				element: <SharedAlbum />,
			},
			{
				path: "join/:token",
				element: <JoinAlbum />,
			},
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
		],
	},
] satisfies RouteObject[];
