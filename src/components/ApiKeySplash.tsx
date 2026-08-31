import React, { useState } from 'react';
import { MapPin, Key, ExternalLink, Settings, Play, Check, AlertCircle } from 'lucide-react';

interface ApiKeySplashProps {
  onEnableDemo: () => void;
}

export function ApiKeySplash({ onEnableDemo }: ApiKeySplashProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    localStorage.setItem('user_custom_maps_api_key', apiKeyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
          <MapPin className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Google Maps Oficial</h1>
        <p className="text-slate-600 text-sm mb-5 leading-relaxed">
          Para carregar as ruas reais, dados de trânsito, fotos de satélite e buscas do Google, insira sua chave da API do Google Maps.
        </p>

        {/* Input to paste key directly */}
        <form onSubmit={handleSaveKey} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-left">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-blue-600" />
            Cole sua Chave de API do Google Maps:
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={!apiKeyInput.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : 'Salvar'}
            </button>
          </div>
          {savedSuccess && (
            <p className="text-emerald-600 text-xs font-semibold mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Chave salva! Recarregando mapa...
            </p>
          )}
        </form>

        {/* Demo Mode Button */}
        <div className="mb-5">
          <button
            onClick={onEnableDemo}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Usar Modo Demonstração (Sem Chave)</span>
          </button>
          <p className="text-[11px] text-slate-400 mt-1.5">Navegue, adicione locais e teste o radar sem configurar chave agora.</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 text-left border border-slate-200 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
            <div className="text-xs text-slate-700">
              Obtenha sua chave no{' '}
              <a 
                href="https://console.cloud.google.com/google/maps-apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
            <div className="text-xs text-slate-700">
              Ative as APIs: <strong className="text-slate-900">Maps JavaScript API</strong>, <strong className="text-slate-900">Places API</strong> e <strong className="text-slate-900">Directions API</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
