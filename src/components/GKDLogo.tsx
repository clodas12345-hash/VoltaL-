import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Navigation, Star, Sparkles } from 'lucide-react';
import { ICON_BASE64 } from '../iconBase64';

export function GKDLogo({ 
  className = "h-8",
  showTextOnMobile = false 
}: { 
  className?: string;
  showTextOnMobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={`relative flex items-center gap-1.5 select-none shrink-0 cursor-pointer hover:opacity-85 transition-opacity ${className}`}
        title="Clique para ver sobre o aplicativo"
      >
        {/* Icon Graphic */}
        <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
          <img 
            src={ICON_BASE64} 
            alt="GKD Mobility" 
            className="w-full h-full object-contain drop-shadow-sm rounded-lg"
          />
        </div>
        {/* Text Mark */}
        <div className={`flex-col ${showTextOnMobile ? 'flex' : 'hidden sm:flex'}`}>
          <span className="font-black tracking-tight text-[#0B1B3D] text-sm sm:text-base leading-none flex items-center">
            GKD
          </span>
          <span className="text-[7px] sm:text-[7.5px] font-extrabold tracking-[0.25em] text-[#0B1B3D] opacity-80 uppercase mt-0.5">
            MOBILITY
          </span>
        </div>
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 text-white relative flex flex-col items-center text-center shrink-0">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-3 p-1 border border-slate-200/60 overflow-hidden">
                <img 
                  src={ICON_BASE64} 
                  alt="GKD Mobility" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <h2 className="text-xl font-bold tracking-tight">VoltaLá</h2>
              <p className="text-xs text-sky-300 font-medium tracking-wide mt-0.5">Versão 1.0.0 • GKD Mobility</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-slate-600 text-sm overflow-y-auto">
              <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 flex gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-blue-950 font-medium leading-relaxed text-xs sm:text-sm">
                  O <b>VoltaLá</b> foi pensado exatamente para aquelas pessoas que passam por um estabelecimento, acham incrível e querem voltar depois, mas acabam esquecendo onde era.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-orange-100 text-orange-600 shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-slate-700"><b>Salves rápidos:</b> Marque qualquer lugar instantaneamente no mapa com um toque.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-blue-100 text-blue-600 shrink-0 mt-0.5">
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-slate-700"><b>Navegador Integrado:</b> Volte ao local exato sem dificuldade e com rotas em tempo real.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
                    <Star className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-slate-700"><b>Informações Completas:</b> Adicione fotos, confira horários, avaliações do Google e anotações pessoais.</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
