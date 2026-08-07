import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 p-6 text-center font-sans">
          <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-3xl max-w-lg shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-black text-rose-400">Rất tiếc! Ứng dụng gặp sự cố.</h1>
            <p className="text-sm text-slate-400">
              Có vẻ như một số dữ liệu nội bộ bị lỗi cấu trúc dẫn đến không thể hiển thị giao diện. Bạn đừng lo lắng, vui lòng tải lại trang để hệ thống khôi phục.
            </p>
            <button
              onClick={() => {
                // Xóa data hỏng để reset lại trạng thái
                localStorage.clear();
                window.location.reload();
              }}
              className="mt-6 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/30 w-full"
            >
              Tải lại ứng dụng ngay
            </button>
            <div className="mt-4 pt-4 border-t border-slate-800 text-left">
              <details className="text-[10px] text-slate-500">
                <summary className="cursor-pointer hover:text-slate-300">Xem chi tiết kỹ thuật</summary>
                <pre className="mt-2 p-3 bg-slate-950 rounded-lg overflow-x-auto border border-slate-800">
                  {this.state.errorInfo && this.state.errorInfo.componentStack.toString()}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
