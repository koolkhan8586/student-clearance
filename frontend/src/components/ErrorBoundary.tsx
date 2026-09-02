import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: (error && error.message) || String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  handleReset = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-4 text-sm">
              The app hit an unexpected error while loading. Resetting your locally cached data usually fixes this.
            </p>
            {this.state.errorMessage && (
              <p className="text-xs font-mono bg-gray-100 text-gray-600 p-2 rounded mb-6 break-words text-left">
                {this.state.errorMessage}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition"
            >
              Reset & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
