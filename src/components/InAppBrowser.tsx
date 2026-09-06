import React from "react";
import { X, ExternalLink, RefreshCw } from "lucide-react";

interface InAppBrowserProps {
  url: string;
  onClose: () => void;
}

export function InAppBrowser({ url, onClose }: InAppBrowserProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-slideUp">
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-800 text-white shadow-lg">
        <button onClick={onClose} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center min-w-0 flex-1 px-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Navegador Seguro</span>
          <div className="text-xs font-bold truncate w-full text-center opacity-80">{url}</div>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-900/20" 
          title="Abrir no navegador externo"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>
      
      <div className="flex-1 w-full bg-slate-100 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center -z-10">
          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mb-4" />
          <p className="text-slate-500 font-medium text-sm">Carregando site...</p>
          <p className="text-slate-400 text-[10px] mt-2 max-w-[200px]">
            Nota: Alguns sites podem não abrir aqui por segurança. 
            Use o botão azul acima para abrir externamente.
          </p>
        </div>
        <iframe 
          src={url} 
          className="w-full h-full border-none relative z-10 bg-white" 
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups" 
          title="In-App Browser" 
        />
      </div>
    </div>
  );
}

