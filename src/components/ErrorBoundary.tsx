import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WifiOff, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkLoadError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    isChunkLoadError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if it's a dynamic import error or fetch error
    const isChunkLoadError = 
      error.name === 'ChunkLoadError' || 
      (error.message && error.message.includes('Failed to fetch dynamically imported module')) ||
      (error.message && error.message.includes('Loading chunk'));

    return { hasError: true, isChunkLoadError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.isChunkLoadError) {
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
            <WifiOff className="w-16 h-16 text-slate-400 mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              نعتذر، هذه الصفحة غير متوفرة حالياً
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
              يبدو أنك غير متصل بالإنترنت حالياً، وهذه الصفحة لم يتم تحميلها مسبقاً.
              يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition"
              >
                <RefreshCcw className="w-5 h-5" />
                تحديث الصفحة
              </button>
              <a 
                href="/"
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-200 transition"
              >
                العودة للرئيسية
              </a>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            حدث خطأ غير متوقع
          </h2>
          <p className="text-slate-600 mb-8">
            نعتذر عن هذا الخلل. يرجى تحديث الصفحة للمحاولة مرة أخرى.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl"
          >
            <RefreshCcw className="w-5 h-5" />
            تحديث الصفحة
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
