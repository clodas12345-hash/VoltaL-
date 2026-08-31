import React, { useState, useEffect } from 'react';
import { X, HelpCircle, ListFilter, Plus, Trash2, Settings as SettingsIcon, Download, Key, Check, ExternalLink, ShieldAlert } from 'lucide-react';
import { PlaceCategory } from '../types';
import { ICON_BASE64 } from '../iconBase64';
import { getActiveGoogleMapsKey } from './MapComponent';

interface SettingsModalProps {
  onClose: () => void;
  categories: PlaceCategory[];
  setCategories: (cats: PlaceCategory[]) => void;
}

export function SettingsModal({ onClose, categories, setCategories }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'mapsKey' | 'help'>('categories');
  const [newCat, setNewCat] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('user_custom_maps_api_key') || '';
      setApiKeyInput(savedKey);
    } catch (e) {}
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (apiKeyInput.trim()) {
        localStorage.setItem('user_custom_maps_api_key', apiKeyInput.trim());
      } else {
        localStorage.removeItem('user_custom_maps_api_key');
      }
      setKeySaveSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearApiKey = () => {
    try {
      localStorage.removeItem('user_custom_maps_api_key');
      setApiKeyInput('');
      setKeySaveSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (e) {}
  };

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    if (!categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
    }
    setNewCat('');
  };

  const handleRemove = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newCats = [...categories];
    [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
    setCategories(newCats);
  };

  const moveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newCats = [...categories];
    [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
    setCategories(newCats);
  };

  const currentActiveKey = getActiveGoogleMapsKey();
  const hasActiveKey = Boolean(currentActiveKey) && currentActiveKey !== 'YOUR_API_KEY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-lg">Configurações</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200/50 hover:bg-slate-200 rounded-full text-slate-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-slate-50 border-b border-slate-100 p-2 gap-1.5 shrink-0 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'categories' ? 'bg-white shadow-sm text-blue-700 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ListFilter className="w-4 h-4" /> Categorias
          </button>
          <button 
            onClick={() => setActiveTab('mapsKey')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'mapsKey' ? 'bg-white shadow-sm text-blue-700 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Key className="w-4 h-4 text-amber-500" /> Chave Google Maps
          </button>
          <button 
            onClick={() => setActiveTab('help')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'help' ? 'bg-white shadow-sm text-blue-700 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <HelpCircle className="w-4 h-4" /> Ajuda
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1 bg-white">
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-800 mb-1">Gerenciar Categorias</h3>
                <p className="text-xs text-slate-500 mb-3">Adicione novas ou mude a ordem (as primeiras aparecem primeiro na barra de atalhos).</p>
                <form onSubmit={handleAddCat} className="flex gap-2 mb-4">
                  <input 
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    placeholder="Ex: Lava Rápido, Parque..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors cursor-pointer">
                    <Plus className="w-5 h-5" />
                  </button>
                </form>

                <div className="space-y-2">
                  {categories.map((cat, i) => (
                    <div key={cat} className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer">
                          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-current" />
                        </button>
                        <button type="button" onClick={() => moveDown(i)} disabled={i === categories.length - 1} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer">
                          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-current" />
                        </button>
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-700 pl-1">{cat}</span>
                      <button onClick={() => handleRemove(cat)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mapsKey' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                    <Key className="w-4 h-4 text-blue-600" /> Status da Chave de API
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${hasActiveKey ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                    {hasActiveKey ? 'Chave Ativa' : 'Modo Demo (Sem Chave)'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  A chave é necessária para carregar o mapa oficial do Google com satélite, trânsito ao vivo, Street View e rotas.
                </p>

                <form onSubmit={handleSaveApiKey} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cole sua Chave da API do Google Maps (AIzaSy...):
                    </label>
                    <input 
                      type="text"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!apiKeyInput.trim()}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Salvar Chave & Recarregar
                    </button>
                    {hasActiveKey && (
                      <button
                        type="button"
                        onClick={handleClearApiKey}
                        className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl border border-red-200 transition-colors cursor-pointer"
                        title="Remover chave e voltar para Modo Demo"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {keySaveSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Configuração salva com sucesso! Recarregando...
                    </div>
                  )}
                </form>
              </div>

              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-2">
                <h4 className="font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Como obter sua chave no Google Cloud:
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                  <li>Acesse o <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">Google Cloud Console</a>.</li>
                  <li>No menu de APIs, verifique se estão ativadas: <b>Maps JavaScript API</b>, <b>Places API</b> e <b>Directions API</b>.</li>
                  <li>Em <b>Credenciais</b>, copie sua chave e cole no campo acima.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-5 text-sm text-slate-600">
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg text-center flex flex-col items-center">
                <div className="relative mb-3">
                  <img 
                    src={ICON_BASE64} 
                    alt="Ícone GKD Mobility" 
                    className="w-28 h-28 rounded-2xl shadow-xl shadow-blue-500/20 border-2 border-slate-700/60 object-contain bg-white p-1"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    OFICIAL
                  </div>
                </div>
                <h3 className="font-bold text-lg text-white mb-1">GKD MOBILITY</h3>
                <p className="text-xs text-slate-400 max-w-xs mb-3">
                  Ícone redimensionado com a margem segura para o Android.
                </p>
                <a 
                  href={ICON_BASE64} 
                  download="icon.png" 
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Baixar icon.png (Com Margem Segura)
                </a>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-base">✨ Sobre o VoltaLá</h3>
                <p className="text-blue-900/90 leading-relaxed font-medium">
                  O <b>VoltaLá</b> foi pensado exatamente para aquelas pessoas que passam por um estabelecimento, acham incrível e querem voltar depois, mas acabam esquecendo onde era.
                </p>
                <p className="text-blue-800/80 mt-2 text-xs leading-relaxed">
                  Com ele, você salva rapidamente o local e depois, sem nenhuma dificuldade, usa o navegador integrado para ir direto até lá. Adicione fotos para te ajudar a lembrar, consulte horários, avaliações do Google e adicione suas próprias anotações pessoais!
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Pesquisa e Filtros</h4>
                <p>Use a barra de pesquisa para buscar endereços, restaurantes ou qualquer lugar. Os botões rápidos abaixo da barra facilitam buscar por categorias. Você pode personalizar esses botões na aba "Categorias".</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Minha Localização (GPS)</h4>
                <p>O botão de "Minha Localização" (seta) vai centralizar o mapa em você. Quando ativado (azul), o mapa seguirá você e irá girar conforme a direção que você aponta o celular. Toque e arraste o mapa para destravar a câmera.</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Adicionar e Salvar Locais</h4>
                <p>Use o botão <b>+</b> para marcar rapidamente sua localização atual. Você também pode tocar e segurar em qualquer lugar do mapa para criar um novo pino ou salvar os locais que pesquisou para ver mais tarde.</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Navegação e Rotas</h4>
                <p>Ao abrir os detalhes de um local, clique em "Ir Agora". O mapa traçará a rota para você dirigir até o destino, incluindo avisos de voz conforme você se aproxima de conversões e manobras.</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Street View</h4>
                <p>Nos detalhes de um local, o botão "Explorar no Street View" entra no modo visão da rua, onde você pode tocar ao redor para navegar como se estivesse lá.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
