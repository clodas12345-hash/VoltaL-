import React, { useState } from 'react';
import { X, HelpCircle, ListFilter, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { PlaceCategory } from '../types';
import { ICON_BASE64 } from '../iconBase64';

interface SettingsModalProps {
  onClose: () => void;
  categories: PlaceCategory[];
  setCategories: (cats: PlaceCategory[]) => void;
}

export function SettingsModal({ onClose, categories, setCategories }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'help'>('categories');
  const [newCat, setNewCat] = useState('');

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

          {activeTab === 'help' && (
            <div className="space-y-4 text-sm text-slate-600">
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg text-center flex flex-col items-center">
                <div className="mb-3">
                  <img 
                    src={ICON_BASE64} 
                    alt="Ícone GKD Mobility" 
                    className="w-24 h-24 rounded-2xl shadow-xl shadow-blue-500/20 border-2 border-slate-700/60 object-contain bg-white p-1"
                  />
                </div>
                <h3 className="font-bold text-lg text-white mb-1">GKD MOBILITY</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Mobilidade inteligente e navegação urbana simplificada.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-base">✨ Sobre o VoltaLá</h3>
                <p className="text-blue-900/90 leading-relaxed font-medium">
                  O <b>VoltaLá</b> foi pensado exatamente para quem passa por um estabelecimento, acha incrível e quer voltar depois, mas acaba esquecendo onde era.
                </p>
                <p className="text-blue-800/80 mt-2 text-xs leading-relaxed">
                  Com ele, você salva rapidamente o local e depois, sem nenhuma dificuldade, usa o navegador integrado para ir direto até lá. Adicione fotos para ajudar a lembrar, consulte horários, avaliações do Google e anotações pessoais!
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
                  🔍 Pesquisa Inteligente e Filtros Rápidos
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Digite qualquer nome, prato ou endereço na barra superior. Toque nas pílulas de categorias (Restaurantes, Padarias, Farmácias, Boates, etc.) para filtrar estabelecimentos instantaneamente dentro do seu raio selecionado.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
                  📡 Radar de Proximidade & Alertas em Tempo Real
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ative o <b>Radar</b> para monitorar termos específicos (como <i>"Comida Mexicana"</i> ou <i>"Maniçoba"</i>) enquanto você se desloca. O app emitirá alerta sonoro e vibratório sempre que você estiver dentro da distância configurada de um local compatível.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
                  📍 Raio de Busca Ajustável
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Altere a abrangência da pesquisa (de 500m até 20km) clicando no seletor de raio na barra superior. O zoom e os resultados do mapa se adaptam automaticamente à distância escolhida.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
                  🧭 Bússola & Rastreamento em Tempo Real
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O botão de localização centraliza o mapa em você. No modo ativo (azul), a câmera do mapa gira suavemente acompanhando a orientação do sensor magnético e giroscópio do seu celular. Toque na bússola no canto para reorientar o Norte.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
                  ➕ Salvar e Marcar Novos Locais
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Toque no botão <b>+</b> para salvar sua posição atual instantaneamente. Você também pode tocar e segurar em qualquer ponto do mapa para criar um marcador personalizado, anexar fotos, definir categorias e registrar lembretes.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
                  🚗 Navegação Turn-by-Turn com Voz
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Abra qualquer local e clique em <b>"Ir Agora"</b>. O VoltaLá traça a melhor rota em tempo real, fornecendo orientações passo a passo e avisos falados de conversões e manobras conforme você dirige.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
                  📷 Street View 360° Integrado
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Toque em <b>"Explorar no Street View"</b> no card do estabelecimento para abrir a visão panorâmica imersiva da fachada e da rua, facilitando o reconhecimento visual do destino antes de sair.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5 text-sm">
                  📁 Meus Lugares Salvos & Backup
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Acesse sua lista completa de locais salvos pelo botão de favoritos no canto inferior direito. Seus dados ficam salvos com segurança no seu dispositivo e você pode filtrar por categoria e buscar anotações a qualquer momento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
