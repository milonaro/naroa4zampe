// Error Boundary React per catturare errori nei componenti figli
// Evita che un singolo crash blocchi l'intera applicazione

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Errore catturato:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <Card className="border-red-200 shadow-sm max-w-md w-full">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <CardTitle className="text-lg text-red-800">
                Qualcosa è andato storto
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-red-600">
                Si è verificato un errore imprevisto. Prova a ricaricare la pagina.
              </p>
              {this.state.error && (
                <details className="text-left text-xs text-red-500 bg-red-50 rounded-lg p-3">
                  <summary className="font-medium cursor-pointer">Dettagli errore</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
                </details>
              )}
              <Button
                onClick={this.handleReset}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Riprova
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
