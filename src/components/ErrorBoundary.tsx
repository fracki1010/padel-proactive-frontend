import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <AlertTriangle size={40} className="text-danger" />
            <h1 className="text-xl font-bold text-foreground">Algo salió mal</h1>
            <p className="text-sm text-default-500">
              {this.state.error?.message || "Ocurrió un error inesperado."}
            </p>
            <button
              onClick={this.handleReset}
              className="mt-2 px-6 py-2 rounded-xl bg-primary text-black font-bold text-sm"
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
