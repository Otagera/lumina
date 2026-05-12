import type { RouteObject } from "react-router-dom";
import Root from "./root";
import Home from "./routes/home";
import EventPage from "./routes/event";
import NotFound from "./routes/not-found";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "e/:token",
        element: <EventPage />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
];

export default routes;
