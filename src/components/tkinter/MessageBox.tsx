import { AlertCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface MessageBoxProps {
  msgId: string;
  msgType: string;
  title: string;
  message: string;
  onResponse: (msgId: string, result: any) => void;
}

export default function MessageBox({ msgId, msgType, title, message, onResponse }: MessageBoxProps) {
  const handleResponse = (result: any) => {
    onResponse(msgId, result);
  };

  const getIcon = () => {
    switch (msgType) {
      case 'showerror':
        return <AlertCircle size={32} className="text-red-500" />;
      case 'showwarning':
        return <AlertTriangle size={32} className="text-amber-500" />;
      case 'showinfo':
        return <Info size={32} className="text-blue-500" />;
      default:
        return <HelpCircle size={32} className="text-blue-500" />;
    }
  };

  const getButtons = () => {
    switch (msgType) {
      case 'showinfo':
      case 'showwarning':
      case 'showerror':
        return (
          <button
            onClick={() => handleResponse('ok')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
          >
            OK
          </button>
        );

      case 'askquestion':
        return (
          <>
            <button
              onClick={() => handleResponse('yes')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => handleResponse('no')}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              No
            </button>
          </>
        );

      case 'askokcancel':
        return (
          <>
            <button
              onClick={() => handleResponse(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              OK
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Cancel
            </button>
          </>
        );

      case 'askyesno':
        return (
          <>
            <button
              onClick={() => handleResponse(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              No
            </button>
          </>
        );

      case 'askretrycancel':
        return (
          <>
            <button
              onClick={() => handleResponse(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Cancel
            </button>
          </>
        );

      case 'askyesnocancel':
        return (
          <>
            <button
              onClick={() => handleResponse(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => handleResponse(false)}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              No
            </button>
            <button
              onClick={() => handleResponse(null)}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Cancel
            </button>
          </>
        );

      default:
        return (
          <button
            onClick={() => handleResponse('ok')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
          >
            OK
          </button>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl min-w-[400px] max-w-[600px] overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        </div>

        <div className="px-6 py-6 flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          {getButtons()}
        </div>
      </div>
    </div>
  );
}
