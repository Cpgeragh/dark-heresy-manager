// src/components/ErrorBoundary.tsx

import React, { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error);
    console.error("Error info:", errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
            <span className="text-3xl text-red-400">⚠</span>
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">
            Something went wrong
          </h1>
          <p className="text-slate-400">
            The application encountered an unexpected error.
          </p>
        </div>

        {/* Error Details (Dev Only) */}
        {isDev && error && (
          <div className="bg-slate-900 border border-slate-700 rounded p-4 space-y-2">
            <div className="text-xs font-mono text-red-400 font-semibold">
              {error.name}
            </div>
            <div className="text-xs font-mono text-slate-300">
              {error.message}
            </div>
            {error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  Stack trace
                </summary>
                <pre className="mt-2 text-[10px] text-slate-500 overflow-x-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onReset}
            className="w-full px-4 py-2 bg-amber-500 text-slate-900 font-semibold rounded hover:bg-amber-400 transition"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="w-full px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded hover:bg-slate-700 transition"
          >
            Go to Home
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-slate-500">
          If this problem persists, please contact support or refresh the page.
        </p>
      </div>
    </div>
  );
}