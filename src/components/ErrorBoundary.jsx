import React from 'react';

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
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900/30 to-pink-900/20">
                    <div className="max-w-md w-full glass-panel rounded-3xl p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="text-6xl mb-4" role="img" aria-hidden="true">
                            🔄
                        </div>
                        <h1 className="text-2xl font-display font-bold text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-white/60 text-sm mb-6">
                            We&apos;ve hit a snag. You can try again or refresh the page.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
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
