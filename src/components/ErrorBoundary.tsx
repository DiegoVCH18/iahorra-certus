import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
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
        <div className="flex flex-col items-center justify-center h-screen bg-certus-light p-6 text-center">
          <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full border-t-4 border-certus-error">
            <h2 className="font-display text-xl font-bold text-certus-blue mb-2">¡Ups! Algo salió mal</h2>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message.includes('Missing or insufficient permissions') 
                ? 'No tienes permisos para realizar esta acción.' 
                : 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'}
            </p>
            <button
              className="w-full bg-certus-magenta text-white font-display font-bold py-3 rounded-xl hover:bg-opacity-90 transition-all"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
