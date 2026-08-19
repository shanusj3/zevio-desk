import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#090e17] text-white p-4">
          <div className="max-w-md w-full bg-[#1b2332] rounded-xl p-6 shadow-xl border border-white/[0.05]">
            <h2 className="text-xl font-bold text-[#F59E0B] mb-4">Something went wrong</h2>
            <p className="text-sm text-[#9aa1b0] mb-4">
              An unexpected error occurred in the application. Please try refreshing the page.
            </p>
            <div className="bg-[#090e17] p-3 rounded text-xs text-red-400 font-mono overflow-auto mb-6">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#D99B26] hover:bg-[#c28a22] text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
