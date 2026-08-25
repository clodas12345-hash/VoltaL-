import React, { useState } from 'react';
import { X, HelpCircle, ListFilter, Plus, GripVertical, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { PlaceCategory } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  categories: PlaceCategory[];
  setCategories: (cats: PlaceCategory[]) => void;
}

export function SettingsModal({ onClose, categories, setCategories }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'help' | 'categories'>('categories');
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
          <button onClick={onClose} className="p-2 bg-slate-200/50 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-slate-50 border-b border-slate-100 p-2 gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'categories' ? 'bg-white shadow-sm text-blue-700 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ListFilter className="w-4 h-4" /> Categorias
          </button>
          <button 
            onClick={() => setActiveTab('help')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'help' ? 'bg-white shadow-sm text-blue-700 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100'}`}
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
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </form>

                <div className="space-y-2">
                  {categories.map((cat, i) => (
                    <div key={cat} className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400">
                          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-current" />
                        </button>
                        <button type="button" onClick={() => moveDown(i)} disabled={i === categories.length - 1} className="text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400">
                          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-current" />
                        </button>
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-700 pl-1">{cat}</span>
                      <button onClick={() => handleRemove(cat)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-5 text-sm text-slate-600">
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
