import { useState } from "react";
import { 
  Outlet, 
  Meta, 
  Links, 
  ScrollRestoration, 
  Scripts, 
  useRouteError, 
  isRouteErrorResponse,
  Link
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Button } from "@lumina/ui/components/ui/button";
import { AlertCircle } from "lucide-react";

import "./index.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="antialiased font-sans">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="p-6 bg-red-100 dark:bg-red-900/20 rounded-[3rem]">
        <AlertCircle className="w-16 h-16 text-red-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
          {isRouteErrorResponse(error)
            ? `${error.status} ${error.statusText}`
            : error instanceof Error
            ? error.message
            : "Unexpected Error"}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
          Something went wrong. Our team of highly trained monkeys is investigating.
        </p>
      </div>
      <Link to="/">
        <Button size="lg" className="rounded-2xl px-8">
          Refresh Page
        </Button>
      </Link>
    </div>
  );
}

export default function Root() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
        <main>
          <Outlet />
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
