import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] text-[#1e293b] p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-[#e2e8f0] text-center space-y-4">
            <img
              src="/assets/error-illustration.png"
              alt="Something went wrong"
              className="w-56 sm:w-64 h-auto mx-auto object-contain"
            />
            
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#1e293b] tracking-tight">Something went wrong</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                An unexpected issue occurred while rendering this page. Please try refreshing to continue.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full h-11 bg-[#116dff] hover:bg-[#0d5fd9] text-white font-bold rounded-xl text-sm transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
