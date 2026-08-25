import React from 'react';
import { MapPin, Key, ExternalLink, Settings, Play } from 'lucide-react';

interface ApiKeySplashProps {
  onEnableDemo: () => void;
}

export function ApiKeySplash({ onEnableDemo }: ApiKeySplashProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <MapPin className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Google Maps & Favoritos</h1>
        <p className="text-slate-600 text-sm mb-6">
          Para utilizar o mapa interativo, busca de estabelecimentos do Google e geolocalização em tempo real, é necessária uma chave da API do Google Maps.
        </p>

        {/* Demo Mode Button */}
        <div className="mb-6">
          <button
            onClick={onEnableDemo}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Experimentar Aplicativo Agora (Modo Demo)</span>
          </button>
          <p className="text-xs text-slate-400 mt-2">Testar todas as funções instantaneamente sem precisar de chave.</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200 mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
            <div className="text-sm text-slate-700">
              Obtenha sua chave em{' '}
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
              >
                Google Cloud Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
            <div className="text-sm text-slate-700">
              Quando o pop-up <strong className="text-slate-900">"Enter your environment variable to continue"</strong> aparecer na interface do AI Studio, cole sua chave e pressione <kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-xs">Enter</kbd>.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
            <div className="text-sm text-slate-700">
              Ou clique no menu <strong className="text-slate-900 flex items-center gap-1 inline-flex"><Settings className="w-3.5 h-3.5" /> Configurações (engrenagem no canto superior direito)</strong> → <strong className="text-slate-900">Secrets</strong> → adicione <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">GOOGLE_MAPS_PLATFORM_KEY</code>.
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          O aplicativo será recarregado automaticamente após configurar a chave.
        </p>
      </div>
    </div>
  );
}
