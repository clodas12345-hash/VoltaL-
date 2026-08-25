import React from "react";
import { X, ExternalLink, RefreshCw } from "lucide-react";

interface InAppBrowserProps {
  url: string;
  onClose: () => void;
}

export function InAppBrowser({ url, onClose }: InAppBrowserProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-slideUp">
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <button onClick={onClose} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-700" />
        </button>
        <div className="text-xs text-slate-500 font-medium truncate max-w-[200px] px-2">{url}</div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors" title="Abrir no navegador externo">
          <ExternalLink className="w-5 h-5 text-slate-700" />
        </a>
      </div>
      <div className="flex-1 w-full bg-slate-100">
        <iframe src={url} className="w-full h-full border-none" sandbox="allow-same-origin allow-scripts allow-forms allow-popups" title="In-App Browser" />
      </div>
    </div>
  );
}

