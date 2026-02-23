import React, { useState, useRef, useEffect } from 'react';
import { X, FolderOpen, Save, Folder, Palette } from 'lucide-react';

interface TkinterDialogProps {
  msgId: string;
  dialogType: string;
  options: Record<string, unknown>;
  onResponse: (msgId: string, result: any) => void;
}

export function TkinterDialog({ msgId, dialogType, options, onResponse }: TkinterDialogProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dialogType.startsWith('ask') && inputRef.current) {
      inputRef.current.focus();
    }

    if (dialogType === 'askcolor' && options.initialcolor) {
      const color = options.initialcolor;
      if (typeof color === 'string') {
        setSelectedColor(color);
      }
    }

    const initialValue = options.initialvalue as string;
    if (initialValue && (dialogType === 'askstring' || dialogType === 'askinteger' || dialogType === 'askfloat')) {
      setInputValue(initialValue);
    }
  }, [dialogType, options]);

  const handleCancel = () => {
    if (dialogType === 'askcolor') {
      onResponse(msgId, null);
    } else if (dialogType === 'askyesnocancel') {
      onResponse(msgId, null);
    } else if (dialogType.startsWith('ask')) {
      onResponse(msgId, null);
    } else {
      onResponse(msgId, '');
    }
  };

  const handleSubmit = () => {
    if (dialogType === 'askstring') {
      onResponse(msgId, inputValue || null);
    } else if (dialogType === 'askinteger') {
      const parsed = parseInt(inputValue);
      onResponse(msgId, isNaN(parsed) ? null : parsed);
    } else if (dialogType === 'askfloat') {
      const parsed = parseFloat(inputValue);
      onResponse(msgId, isNaN(parsed) ? null : parsed);
    } else if (dialogType === 'askcolor') {
      const hex = selectedColor;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      onResponse(msgId, [[r, g, b], hex]);
    } else if (dialogType.startsWith('askopen') || dialogType.startsWith('asksaveas') || dialogType === 'askdirectory') {
      onResponse(msgId, inputValue || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const renderDialogContent = () => {
    const title = (options.title as string) || 'Input';
    const prompt = (options.prompt as string) || '';

    if (dialogType === 'askstring' || dialogType === 'askinteger' || dialogType === 'askfloat') {
      return (
        <>
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          </div>

          <div className="px-6 py-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">{prompt}</label>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder={dialogType === 'askinteger' ? 'Enter an integer' : dialogType === 'askfloat' ? 'Enter a number' : 'Enter text'}
            />
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              OK
            </button>
          </div>
        </>
      );
    }

    if (dialogType === 'askcolor') {
      return (
        <>
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center gap-3">
            <Palette size={20} className="text-slate-600" />
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-24 h-24 rounded-lg cursor-pointer border-2 border-slate-300"
                />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Hex Color</label>
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                  '#800000', '#808080', '#800080', '#008000', '#000080', '#808000', '#008080', '#C0C0C0'].map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className="w-8 h-8 rounded border-2 border-slate-300 hover:border-slate-500 transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              OK
            </button>
          </div>
        </>
      );
    }

    if (dialogType.startsWith('askopen') || dialogType.startsWith('asksaveas') || dialogType === 'askdirectory') {
      const icon = dialogType === 'askdirectory' ? Folder : dialogType.startsWith('asksaveas') ? Save : FolderOpen;
      const Icon = icon;

      return (
        <>
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center gap-3">
            <Icon size={20} className="text-slate-600" />
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                {dialogType === 'askdirectory' ? 'Enter a directory path:' :
                 dialogType.startsWith('asksaveas') ? 'Enter a filename to save:' :
                 'Enter a filename to open:'}
              </p>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder={dialogType === 'askdirectory' ? '/path/to/directory' : 'filename.txt'}
              />
              <p className="text-xs text-slate-500">
                Note: This is a simulated file dialog. Enter the path/filename you want to use.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-sm transition-colors"
            >
              {dialogType.startsWith('asksaveas') ? 'Save' : dialogType === 'askdirectory' ? 'Select' : 'Open'}
            </button>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl min-w-[500px] max-w-[600px] overflow-hidden border border-slate-200">
        {renderDialogContent()}
      </div>
    </div>
  );
}
