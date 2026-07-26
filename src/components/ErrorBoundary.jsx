import React from 'react';
import { reportAppError } from '../lib/telemetry';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        reportAppError('error_boundary', error, {
            componentStack: errorInfo?.componentStack || null,
        });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="wordle-shell min-h-screen w-full flex flex-col items-center justify-center p-6">
                    <div className="max-w-md w-full wordle-card p-8 text-center animate-spring-in">
                        <div className="text-6xl mb-4" role="img" aria-hidden="true">
                            🔄
                        </div>
                        <h1 className="text-2xl font-display font-bold tracking-tight text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-white/55 text-sm mb-6">
                            We&apos;ve hit a snag. You can try again or refresh the page.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="wordle-button wordle-primary flex-1"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="wordle-button flex-1 text-white/75"
                            >
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
