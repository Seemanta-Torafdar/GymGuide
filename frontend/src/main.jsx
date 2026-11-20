import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GymGuideProvider } from './context/GymGuideContext';
import App from './App';
import './styles/index.css';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('GymGuide UI Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#E5E8CE] text-[#263B2D] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#F1F2E8] border border-[#D2D9C5] rounded-2xl p-6 space-y-4 shadow-sm">
            <h1 className="text-xl font-bold text-[#173F35]">
              GymGuide Interface Reload Required
            </h1>
            <p className="text-xs text-[#657565]">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#789575] text-[#F1F2E8] text-xs font-bold transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <GymGuideProvider>
          <App />
        </GymGuideProvider>
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);
