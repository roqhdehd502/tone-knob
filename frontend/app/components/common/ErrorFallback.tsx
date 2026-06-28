import { Link } from "react-router";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

interface ErrorFallbackProps {
  title: string;
  description: string;
  stack?: string;
}

export function ErrorFallback({ title, description, stack }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
          {stack && (
            <pre className="w-full max-h-48 overflow-auto rounded-lg bg-gray-100 p-3 text-left text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <code>{stack}</code>
            </pre>
          )}
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
            <Button asChild className="flex-1">
              <Link to="/">
                <Home className="h-4 w-4" />
                홈으로
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
