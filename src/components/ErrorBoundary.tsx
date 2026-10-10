// src/components/ErrorBoundary.tsx

import React, { Component } from "react";
import type { ReactNode } from "react";
import { Button } from "../ui/buttons/Button";
import { uiSection, uiTextError, uiTextBody, uiTextPlaceholder } from "../ui/styles/editableStyles";
import { colourTextPrimary, colourPageBackground, colourStateRed } from "../ui/styles/colourTokens";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundaryImplementation extends Component<Props, State> {
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

export function ErrorBoundary(props: Props) {
  return <ErrorBoundaryImplementation {...props} />;
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className={`fixed inset-0 z-40 flex overflow-y-auto ${colourPageBackground} p-4 pt-14`}>
      <div className="m-auto w-full max-w-md space-y-4">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div
            className={`w-16 h-16 rounded-full ${colourStateRed} border-2 flex items-center justify-center`}
          >
            <span className={`text-3xl ${uiTextError}`}>⚠</span>
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center space-y-2">
          <h1 className={`text-2xl font-bold ${colourTextPrimary}`}>Something went wrong</h1>
          <p className={uiTextError}>The application encountered an unexpected error.</p>
        </div>

        {/* Error Details (Dev Only) */}
        {isDev && error && (
          <div className={`${uiSection} space-y-2`}>
            <div className={`text-xs font-mono ${uiTextError} font-semibold`}>{error.name}</div>
            <div className={`text-xs font-mono ${uiTextBody}`}>{error.message}</div>
            {error.stack && (
              <details className="mt-2">
                <summary
                  className={`text-xs ${uiTextPlaceholder} cursor-pointer hover:text-slate-400`}
                >
                  Stack trace
                </summary>
                <pre className={`mt-2 text-[10px] ${uiTextPlaceholder} overflow-x-auto`}>
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={onReset}>
            Try Again
          </Button>
          <Button variant="secondary" fullWidth onClick={() => (window.location.href = "/")}>
            Go to Home
          </Button>
        </div>

        {/* Help Text */}
        <p className={`text-xs text-center ${uiTextPlaceholder}`}>
          If this problem persists, please contact support or refresh the page.
        </p>
      </div>
    </div>
  );
}
