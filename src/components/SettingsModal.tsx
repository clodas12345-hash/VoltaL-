import React, { useState, useRef, useEffect } from 'react';
import { 
  X, HelpCircle, ListFilter, Plus, Trash2, Settings as SettingsIcon, 
  Download, Upload, AlertTriangle, Share2, Image as ImageIcon, CheckCircle2,
  ShieldCheck, Bell, Camera as CameraIcon, Navigation as NavIcon,
  Users, Wifi, Mic, Music
} from 'lucide-react';
import { PlaceCategory } from '../types';
import { getPhotoCacheStats, clearPhotoCache } from '../utils/photoCache';
import { ICON_BASE64 } from '../iconBase64';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera } from '@capacitor/camera';

interface SettingsModalProps {
  onClose: () => void;
  categories: PlaceCategory[];
  setCategories: (cats: PlaceCategory[]) => void;
  savedPlaces: any[];
  setSavedPlaces: (places: any[]) => void;
  radarConfig: any;
  setRadarConfig: (config: any) => void;
}

export function SettingsModal({ 
  onClose, 
  categories, 
  setCategories,
  savedPlaces,
  setSavedPlaces,
  radarConfig,
  setRadarConfig
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'backup' | 'permissions' | 'help'>('categories');
  const [newCat, setNewCat] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [cacheStats, setCacheStats] = useState<{ count: number; estimatedSizeKb: number }>({ count: 0, estimatedSizeKb: 0 });
  const [cacheClearedMsg, setCacheClearedMsg] = useState(false);

  const [gpsStatus, setGpsStatus] = useState<string>('Clique para verificar');
  const [notifStatus, setNotifStatus] = useState<string>('Clique para verificar');
  const [cameraStatus, setCameraStatus] = useState<string>('Clique para verificar');
  const [contactsStatus, setContactsStatus] = useState<string>('Clique para verificar');
  const [nearbyStatus, setNearbyStatus] = useState<string>('Clique para verificar');
  const [photosStatus, setPhotosStatus] = useState<string>('Clique para verificar');
  const [micStatus, setMicrophoneStatus] = useState<string>('Clique para verificar');
  const [musicStatus, setMusicStatus] = useState<string>('Clique para verificar');

  const checkGpsPermission = async () => {
    try {
      if ('geolocation' in navigator) {
        if (navigator.permissions && (navigator.permissions as any).query) {
          const res = await navigator.permissions.query({ name: 'geolocation' as any });
          setGpsStatus(res.state === 'granted' ? 'Concedido' : res.state === 'denied' ? 'Negado' : 'Aguardando');
          return;
        }
      }
      setGpsStatus('Suportado');
    } catch (e) {
      setGpsStatus('Suportado');
    }
  };

  const requestGpsPermission = async () => {
    try {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGpsStatus('Concedido');
        },
        (err) => {
          setGpsStatus(err.code === 1 ? 'Negado' : 'Erro');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } catch (e) {
      setGpsStatus('Erro');
    }
  };

  const checkNotifPermission = async () => {
    try {
      const status = await LocalNotifications.checkPermissions();
      setNotifStatus(status.display === 'granted' ? 'Concedido' : status.display === 'denied' ? 'Negado' : 'Aguardando');
    } catch (e) {
      if ('Notification' in window) {
        setNotifStatus(Notification.permission === 'granted' ? 'Concedido' : Notification.permission === 'denied' ? 'Negado' : 'Aguardando');
      } else {
        setNotifStatus('Não suportado');
      }
    }
  };

  const requestNotifPermission = async () => {
    try {
      const res = await LocalNotifications.requestPermissions();
      setNotifStatus(res.display === 'granted' ? 'Concedido' : 'Negado');
    } catch (e) {
      if ('Notification' in window) {
        const res = await Notification.requestPermission();
        setNotifStatus(res === 'granted' ? 'Concedido' : 'Negado');
      } else {
        setNotifStatus('Não suportado');
      }
    }
  };

  const checkCameraPermission = async () => {
    try {
      const status = await Camera.checkPermissions();
      setCameraStatus(status.camera === 'granted' ? 'Concedido' : status.camera === 'denied' ? 'Negado' : 'Aguardando');
    } catch (e) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setCameraStatus('Suportado');
      } else {
        setCameraStatus('Não suportado');
      }
    }
  };

  const requestCameraPermission = async () => {
    try {
      const res = await Camera.requestPermissions();
      setCameraStatus(res.camera === 'granted' ? 'Concedido' : 'Negado');
    } catch (e) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraStatus('Concedido');
      } catch (err) {
        setCameraStatus('Negado');
      }
    }
  };

  const checkContactsPermission = async () => {
    try {
      if (navigator.permissions && (navigator.permissions as any).query) {
        const res = await navigator.permissions.query({ name: 'contacts' as any });
        setContactsStatus(res.state === 'granted' ? 'Concedido' : res.state === 'denied' ? 'Negado' : 'Aguardando');
        return;
      }
      setContactsStatus('Suportado');
    } catch (e) {
      setContactsStatus('Suportado');
    }
  };

  const requestContactsPermission = async () => {
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        setContactsStatus('Concedido');
      } else {
        const confirm = window.confirm("Permitir que o aplicativo VoltaLá acesse seus contatos para vincular endereços de amigos?");
        setContactsStatus(confirm ? 'Concedido' : 'Negado');
      }
    } catch (e) {
      setContactsStatus('Erro');
    }
  };

  const checkNearbyPermission = async () => {
    try {
      if (navigator.permissions && (navigator.permissions as any).query) {
        const res = await navigator.permissions.query({ name: 'bluetooth' as any });
        setNearbyStatus(res.state === 'granted' ? 'Concedido' : res.state === 'denied' ? 'Negado' : 'Aguardando');
        return;
      }
      setNearbyStatus('Suportado');
    } catch (e) {
      setNearbyStatus('Suportado');
    }
  };

  const requestNearbyPermission = async () => {
    try {
      if ((navigator as any).bluetooth) {
        await (navigator as any).bluetooth.getAvailability();
        setNearbyStatus('Concedido');
      } else {
        const confirm = window.confirm("Permitir que o aplicativo VoltaLá encontre e conecte-se a dispositivos por perto (beacons de estacionamento, etc.)?");
        setNearbyStatus(confirm ? 'Concedido' : 'Negado');
      }
    } catch (e) {
      setNearbyStatus('Erro');
    }
  };

  const checkPhotosPermission = async () => {
    try {
      const status = await Camera.checkPermissions();
      setPhotosStatus(status.photos === 'granted' ? 'Concedido' : status.photos === 'denied' ? 'Negado' : 'Aguardando');
    } catch (e) {
      setPhotosStatus('Suportado');
    }
  };

  const requestPhotosPermission = async () => {
    try {
      const res = await Camera.requestPermissions();
      setPhotosStatus(res.photos === 'granted' ? 'Concedido' : 'Negado');
    } catch (e) {
      setPhotosStatus('Concedido');
    }
  };

  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions && (navigator.permissions as any).query) {
        const res = await navigator.permissions.query({ name: 'microphone' as any });
        setMicrophoneStatus(res.state === 'granted' ? 'Concedido' : res.state === 'denied' ? 'Negado' : 'Aguardando');
        return;
      }
      setMicrophoneStatus('Suportado');
    } catch (e) {
      setMicrophoneStatus('Suportado');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicrophoneStatus('Concedido');
    } catch (e) {
      setMicrophoneStatus('Negado');
    }
  };

  const checkMusicPermission = async () => {
    setMusicStatus('Suportado');
  };

  const requestMusicPermission = async () => {
    const confirm = window.confirm("Permitir que o aplicativo VoltaLá acesse suas músicas e áudios salvos para alertas de radar customizados?");
    setMusicStatus(confirm ? 'Concedido' : 'Negado');
  };

  const triggerTestNotification = async () => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'VoltaLá 📡 Teste de Notificação',
            body: 'As notificações do VoltaLá estão funcionando perfeitamente no seu dispositivo!',
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 1000) }
          }
        ]
      });
    } catch (e) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('VoltaLá 📡 Teste de Notificação', {
          body: 'As notificações do VoltaLá estão funcionando perfeitamente no seu dispositivo!'
        });
      } else {
        alert('Por favor, conceda permissão de notificações primeiro!');
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'backup') {
      getPhotoCacheStats().then(setCacheStats);
    } else if (activeTab === 'permissions') {
      checkGpsPermission();
      checkNotifPermission();
      checkCameraPermission();
      checkContactsPermission();
      checkNearbyPermission();
      checkPhotosPermission();
      checkMicrophonePermission();
      checkMusicPermission();
    }
  }, [activeTab]);

  const handleClearPhotoCache = async () => {
    await clearPhotoCache();
    const stats = await getPhotoCacheStats();
    setCacheStats(stats);
    setCacheClearedMsg(true);
    setTimeout(() => setCacheClearedMsg(false), 3000);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = {
        categories,
        savedPlaces,
        radarConfig,
        version: '1.0',
        exportedAt: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const fileName = `Backup_VoltaLa_${day}-${month}-${year}.json`;

      // 1. Tentar File System Access API (permite escolher a pasta de destino no navegador/PC)
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'Arquivo JSON de Backup VoltaLá',
              accept: { 'application/json': ['.json'] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(jsonString);
          await writable.close();
          setImportStatus({ type: 'success', message: 'Backup salvo na pasta escolhida com sucesso!' });
          return;
        } catch (pickerErr: any) {
          if (pickerErr.name === 'AbortError') {
            return;
          }
        }
      }

      // 2. Fallback robusto para APK (Android WebView) e navegadores usando Data URI
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setImportStatus({ type: 'success', message: 'Backup gerado e enviado para download com sucesso!' });
    } catch (e: any) {
      setImportStatus({ type: 'error', message: `Erro ao exportar: ${e.message}` });
    }
  };


  const handleShare = async () => {
    try {
      const data = {
        categories,
        savedPlaces,
        radarConfig,
        version: '1.0',
        exportedAt: new Date().toISOString()
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const fileName = `Backup_VoltaLa_${day}-${month}-${year}.json`;
      
      const file = new File([jsonString], fileName, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Backup VoltaLá',
          text: `Backup dos locais salvos no VoltaLá (${savedPlaces.length} locais)`
        });
        setImportStatus({ type: 'success', message: 'Backup compartilhado com sucesso!' });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Backup VoltaLá',
          text: jsonString
        });
        setImportStatus({ type: 'success', message: 'Backup compartilhado com sucesso!' });
      } else {
        await handleExport();
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setImportStatus({ type: 'error', message: `Erro ao compartilhar: ${e.message}` });
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.savedPlaces || !Array.isArray(data.savedPlaces)) {
          throw new Error('Formato de backup inválido: lista de locais não encontrada.');
        }

        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
        
        if (data.radarConfig) {
          setRadarConfig(data.radarConfig);
        }

        setSavedPlaces(data.savedPlaces);
        setImportStatus({ type: 'success', message: 'Backup restaurado com sucesso!' });
        
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        setImportStatus({ type: 'error', message: `Erro na importação: ${err.message}` });
      }
    };
    reader.readAsText(file);
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
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'backup' ? 'bg-white shadow-sm text-blue-700 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Trash2 className="w-4 h-4" /> Backup
          </button>
          <button 
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'permissions' ? 'bg-white shadow-sm text-blue-700 border border-slate-200/60' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ShieldCheck className="w-4 h-4" /> Permissões
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

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Backup e Sincronização</h3>
                    <p className="text-[11px] text-slate-500">Mantenha seus dados seguros em arquivos JSON.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button 
                    onClick={handleExport}
                    className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 p-3 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Baixar .JSON</span>
                  </button>

                  <button 
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 p-3 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Enviar / Salvar</span>
                  </button>
                  
                  <button 
                    onClick={handleImportClick}
                    className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-slate-100 hover:border-slate-800 hover:bg-slate-50 p-3 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Importar</span>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                    />
                  </button>
                </div>

                {importStatus && (
                  <div className={`mt-4 p-3 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300 border ${
                    importStatus.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {importStatus.message}
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900">Atenção ao Importar</h4>
                  <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                    A importação de um novo arquivo <b>substituirá permanentemente</b> todos os seus locais salvos, categorias e configurações atuais.
                  </p>
                </div>
              </div>

              {/* Persistent IndexedDB Photo Cache Management */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">Cache Local de Fotos (IndexedDB)</h4>
                      <p className="text-[10px] text-emerald-800 font-medium">Economia de dados & carregamento instantâneo</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
                    {cacheStats.count} fotos (~{cacheStats.estimatedSizeKb} KB)
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800/90 leading-relaxed mb-3">
                  As fotos do Google Places e Street View ficam salvas de forma persistente no seu aparelho. Isso evita novas cobranças e chamadas repetidas na API do Google e permite visualização offline.
                </p>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleClearPhotoCache}
                    className="text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Limpar Cache de Fotos</span>
                  </button>
                  {cacheClearedMsg && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cache limpo!
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-800 mb-1">Como funciona?</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  O backup gera um arquivo de texto (.json) que contém todas as suas informações do app. Você pode guardar este arquivo no Google Drive, iCloud ou enviar para si mesmo para nunca perder seus lugares favoritos.
                </p>
              </div>
            </div>
          )}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Controle de Permissões</h3>
                    <p className="text-[11px] text-slate-500">Verifique e conceda permissões nativas para o app funcionar 100%.</p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {/* GPS / Location Permission */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <NavIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">Localização (GPS)</h4>
                        <p className="text-[10px] text-slate-500">Estado: <span className={`font-bold ${gpsStatus === 'Concedido' ? 'text-emerald-600' : gpsStatus === 'Negado' ? 'text-rose-500' : 'text-amber-500'}`}>{gpsStatus}</span></p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={requestGpsPermission}
                      className="text-xs font-bold bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
                    >
                      Solicitar
                    </button>
                  </div>

                  {/* Notification Permission */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">Notificações Push / Locais</h4>
                        <p className="text-[10px] text-slate-500">Estado: <span className={`font-bold ${notifStatus === 'Concedido' ? 'text-emerald-600' : notifStatus === 'Negado' ? 'text-rose-500' : 'text-amber-500'}`}>{notifStatus}</span></p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={requestNotifPermission}
                      className="text-xs font-bold bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
                    >
                      Solicitar
                    </button>
                  </div>

                  {/* Camera Permission */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <CameraIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">Câmera</h4>
                        <p className="text-[10px] text-slate-500">Estado: <span className={`font-bold ${cameraStatus === 'Concedido' ? 'text-emerald-600' : cameraStatus === 'Negado' ? 'text-rose-500' : 'text-amber-500'}`}>{cameraStatus}</span></p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={requestCameraPermission}
                      className="text-xs font-bold bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
                    >
                      Solicitar
                    </button>
                  </div>

                  {/* Contacts Permission */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">Contatos</h4>
                        <p className="text-[10px] text-slate-500">Estado: <span className={`font-bold ${contactsStatus === 'Concedido' ? 'text-emerald-600' : contactsStatus === 'Negado' ? 'text-rose-500' : 'text-amber-500'}`}>{contactsStatus}</span></p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={requestContactsPermission}
                      className="text-xs font-bold bg-white text-amber-700 hover:bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
                    >
                      Solicitar
                    </button>
                  </div>

                  {/* Bluetooth / Nearby Devices Permission */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">Dispositivos Próximos (Bluetooth)</h4>
                        <p className="text-[10px] text-slate-500">Estado: <span className={`font-bold ${nearbyStatus === 'Concedido' ? 'text-emerald-600' : nearbyStatus === 'Negado' ? 'text-rose-500' : 'text-amber-500'}`}>{nearbyStatus}</span></p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={requestNearbyPermission}
                      className="text-xs font-bold bg-white text-teal-700 hover:bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
                    >
                      Solicitar
                    </button>
                  </div>

                  {/* Photos / Gallery Permission */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">Acesso à Galeria de Fotos</h4>
                        <p className="text-[10px] text-slate-500">Estado: <span className={`font-bold ${photosStatus === 'Concedido' ? 'text-emerald-600' : photosStatus === 'Negado' ? 'text-rose-500' : 'text-amber-500'}`}>{photosStatus}</span></p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={requestPhotosPermission}
                      className="text-xs font-bold bg-white text-pink-700 hover:bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
                    >
                      Solicitar
                    </button>
                  </div>

                  {/* Microphone Permission */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">Microfone (Áudio)</h4>
                        <p className="text-[10px] text-slate-500">Estado: <span className={`font-bold ${micStatus === 'Concedido' ? 'text-emerald-600' : micStatus === 'Negado' ? 'text-rose-500' : 'text-amber-500'}`}>{micStatus}</span></p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={requestMicrophonePermission}
                      className="text-xs font-bold bg-white text-orange-700 hover:bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
                    >
                      Solicitar
                    </button>
                  </div>

                  {/* Music / Media Files Permission */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">Arquivos de Música e Áudio</h4>
                        <p className="text-[10px] text-slate-500">Estado: <span className={`font-bold ${musicStatus === 'Concedido' ? 'text-emerald-600' : musicStatus === 'Negado' ? 'text-rose-500' : 'text-amber-500'}`}>{musicStatus}</span></p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={requestMusicPermission}
                      className="text-xs font-bold bg-white text-purple-700 hover:bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs shrink-0"
                    >
                      Solicitar
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Testar Notificação</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Clique no botão abaixo para simular um alerta sonoro e de vibração imediato no aparelho, confirmando que as notificações em background estão ativadas.
                  </p>
                  <button
                    type="button"
                    onClick={triggerTestNotification}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>Enviar Notificação de Teste</span>
                  </button>
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
