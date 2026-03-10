import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Download, Upload, Settings2, Save, FolderOpen, Trash2 } from 'lucide-react';
import PixTinModel from './components/PixTinModel';
import FaceEditor from './components/FaceEditor';
import { useFaceTexture, FaceDimensions } from './hooks/useFaceTexture';
import { type TinConfig, type FaceConfig, type ImageItem } from './types';
import { getSavedDesigns, saveDesignToDB, updateDesignInDB, deleteDesignFromDB, type SavedDesign } from './storage';

const genId = () => Math.random().toString(36).substring(2, 9);
const faces: (keyof TinConfig)[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
const defaultFace: FaceConfig = { color: '#f0f0f0', images: [] };

function App() {
  const [config, setConfig] = useState<TinConfig>({
    baseColor: '#f0f0f0',
    front: { ...defaultFace },
    back: { ...defaultFace },
    left: { ...defaultFace },
    right: { ...defaultFace },
    top: { ...defaultFace },
    bottom: { ...defaultFace },
    hinges: '#dddddd',
    lidLine: '#bbbbbb',
  });

  const [selectedTab, setSelectedTab] = useState<keyof TinConfig | 'hardware'>('front');
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load saved designs on mount
  useEffect(() => {
    getSavedDesigns().then(setSavedDesigns);
  }, []);

  const frontMap = useFaceTexture('front', config.front);
  const backMap = useFaceTexture('back', config.back);
  const leftMap = useFaceTexture('left', config.left);
  const rightMap = useFaceTexture('right', config.right);
  const topMap = useFaceTexture('top', config.top);
  const bottomMap = useFaceTexture('bottom', config.bottom);

  const textures = {
    front: frontMap,
    back: backMap,
    left: leftMap,
    right: rightMap,
    top: topMap,
    bottom: bottomMap,
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (selectedTab === 'hardware') return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const aspect = img.naturalWidth / img.naturalHeight;
          const newItem: ImageItem = {
            id: genId(),
            url: result,
            x: 0.5,
            y: 0.5,
            scale: 0.5,
            aspectRatio: aspect
          };
          setConfig(prev => ({
            ...prev,
            [selectedTab as string]: {
              ...(prev[selectedTab as keyof TinConfig] as FaceConfig),
              images: [...(prev[selectedTab as keyof TinConfig] as FaceConfig).images, newItem]
            }
          }));
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadDesign = () => {
    if (!canvasRef.current) return;
    const image = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'pix-tin-design.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToDB = async () => {
    if (currentDesignId) {
      // Update existing
      const updated = await updateDesignInDB(currentDesignId, saveName || 'Untitled', config);
      if (updated) {
        setSavedDesigns(prev => prev.map(d => d.id === currentDesignId ? updated : d));
      }
    } else {
      // Save new
      const newD = await saveDesignToDB(saveName || 'New Design', config);
      setSavedDesigns(prev => [...prev, newD]);
      setCurrentDesignId(newD.id);
    }
    setShowSaveModal(false);
  };

  const loadDesign = (design: SavedDesign) => {
    setConfig(design.config);
    setCurrentDesignId(design.id);
    setSaveName(design.name);
  };

  const deleteDesign = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteDesignFromDB(id);
    setSavedDesigns(prev => prev.filter(d => d.id !== id));
    if (currentDesignId === id) {
      setCurrentDesignId(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-900 text-white font-sans overflow-hidden">

      {/* 3D Canvas Area */}
      <div className="flex-1 relative">
        <Canvas
          ref={canvasRef}
          camera={{ position: [0, 2, 8], fov: 45 }}
          gl={{ preserveDrawingBuffer: true }}
          className="w-full h-full bg-neutral-800"
        >
          <color attach="background" args={['#1a1a1a']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          <Environment preset="city" />

          <PixTinModel textures={textures} hingesColor={config.hinges} lidLineColor={config.lidLine} />

          <ContactShadows position={[0, -2.5, 0]} opacity={0.6} scale={10} blur={2} far={4} />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
        </Canvas>

        {/* Floating actions */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <button
            onClick={() => {
              setSaveName(savedDesigns.find(d => d.id === currentDesignId)?.name || 'My Cool Tin');
              setShowSaveModal(true);
            }}
            className="flex items-center gap-2 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 transition-colors px-4 py-2 rounded-lg font-medium shadow-lg"
          >
            <Save size={18} />
            Save to DB
          </button>
          <button
            onClick={downloadDesign}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 transition-colors px-4 py-2 rounded-lg font-medium shadow-lg"
          >
            <Download size={18} />
            Export Image
          </button>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="w-full md:w-96 bg-neutral-950 border-t md:border-t-0 md:border-l border-neutral-800 p-6 flex flex-col overflow-y-auto" style={{ maxHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Pix Designer
            </h1>
            <p className="text-neutral-400 text-sm">Advanced customization</p>
          </div>

          {/* Saved Designs Dropdown - A simple list for now */}
          <div className="relative group">
            <button className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-md text-sm font-medium border border-neutral-700 transition-colors">
              <FolderOpen size={16} />
              Load
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <div className="p-3 bg-neutral-900 border-b border-neutral-700 text-xs font-semibold text-neutral-400 uppercase">
                Saved Designs
              </div>
              <div className="max-h-64 overflow-y-auto">
                {savedDesigns.length === 0 ? (
                  <div className="p-4 text-sm text-neutral-500 italic text-center">No saved designs</div>
                ) : (
                  savedDesigns.map(design => (
                    <div
                      key={design.id}
                      onClick={() => loadDesign(design)}
                      className={`flex items-center justify-between p-3 border-b border-neutral-700/50 cursor-pointer hover:bg-neutral-700 transition-colors ${currentDesignId === design.id ? 'bg-teal-900/20 border-l-2 border-l-teal-500' : ''}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-200">{design.name}</p>
                        <p className="text-xs text-neutral-500">{new Date(design.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={(e) => deleteDesign(design.id, e)}
                        className="text-neutral-500 hover:text-red-400 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          {/* Tabs */}
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Select Part</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {faces.map((face) => (
                <button
                  key={face}
                  onClick={() => setSelectedTab(face)}
                  className={`px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-all border ${selectedTab === face
                    ? 'bg-neutral-800 border-teal-500 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                >
                  {face.charAt(0).toUpperCase() + face.slice(1)}
                </button>
              ))}
              <button
                onClick={() => setSelectedTab('hardware')}
                className={`col-span-3 px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-all border flex items-center justify-center gap-1 ${selectedTab === 'hardware'
                  ? 'bg-neutral-800 border-emerald-500 text-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
              >
                <Settings2 size={14} />
                Hardware & Trim
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-neutral-800 my-2" />

          {
            selectedTab === 'hardware' ? (
              <div className="space-y-6">
                <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Hardware Colors</h3>

                <div className="flex items-center justify-between bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                  <span className="text-sm font-medium text-neutral-300">Base Tin Color</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={config.baseColor}
                      onChange={e => {
                        const newColor = e.target.value;
                        setConfig(prev => ({
                          ...prev,
                          baseColor: newColor,
                          front: { ...prev.front, color: newColor },
                          back: { ...prev.back, color: newColor },
                          left: { ...prev.left, color: newColor },
                          right: { ...prev.right, color: newColor },
                          top: { ...prev.top, color: newColor },
                          bottom: { ...prev.bottom, color: newColor },
                        }));
                      }}
                      className="w-20 px-2 py-1 text-sm bg-neutral-950 border border-neutral-700 rounded text-neutral-300 focus:outline-none focus:border-teal-500"
                      placeholder="#HEX"
                    />
                    <input
                      type="color"
                      value={config.baseColor}
                      onChange={e => {
                        const newColor = e.target.value;
                        setConfig(prev => ({
                          ...prev,
                          baseColor: newColor,
                          front: { ...prev.front, color: newColor },
                          back: { ...prev.back, color: newColor },
                          left: { ...prev.left, color: newColor },
                          right: { ...prev.right, color: newColor },
                          top: { ...prev.top, color: newColor },
                          bottom: { ...prev.bottom, color: newColor },
                        }));
                      }}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                  <span className="text-sm font-medium text-neutral-300">Hinges Color</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={config.hinges}
                      onChange={e => setConfig(prev => ({ ...prev, hinges: e.target.value }))}
                      className="w-20 px-2 py-1 text-sm bg-neutral-950 border border-neutral-700 rounded text-neutral-300 focus:outline-none focus:border-teal-500"
                      placeholder="#HEX"
                    />
                    <input
                      type="color"
                      value={config.hinges}
                      onChange={e => setConfig(prev => ({ ...prev, hinges: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                  <span className="text-sm font-medium text-neutral-300">Lid Separator Line Color</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={config.lidLine}
                      onChange={e => setConfig(prev => ({ ...prev, lidLine: e.target.value }))}
                      className="w-20 px-2 py-1 text-sm bg-neutral-950 border border-neutral-700 rounded text-neutral-300 focus:outline-none focus:border-teal-500"
                      placeholder="#HEX"
                    />
                    <input
                      type="color"
                      value={config.lidLine}
                      onChange={e => setConfig(prev => ({ ...prev, lidLine: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 flex-1 mb-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">
                    {selectedTab} Face Options
                  </h3>
                </div>

                <div
                  className="border border-dashed border-teal-700/50 hover:border-teal-500 bg-teal-950/20 transition-colors rounded-xl p-4 text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-2 text-teal-500" size={20} />
                  <p className="text-sm font-medium text-teal-300">Add Image to Face</p>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

                <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                  <FaceEditor
                    face={selectedTab as string}
                    config={config[selectedTab as keyof TinConfig] as FaceConfig}
                    onChange={(newConfig) => {
                      setConfig(prev => ({ ...prev, [selectedTab as string]: newConfig }));
                    }}
                    onApplyToAll={(color: string) => {
                      setConfig(prev => ({
                        ...prev,
                        front: { ...prev.front, color },
                        back: { ...prev.back, color },
                        left: { ...prev.left, color },
                        right: { ...prev.right, color },
                        top: { ...prev.top, color },
                        bottom: { ...prev.bottom, color },
                      }));
                    }}
                    aspectRatio={FaceDimensions[selectedTab as keyof typeof FaceDimensions].w / FaceDimensions[selectedTab as keyof typeof FaceDimensions].h}
                  />
                </div>
              </div>
            )
          }
        </div >
      </div >

      {/* Save Modal */}
      {
        showSaveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-sm w-full p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Save Design</h2>
              <p className="text-sm text-neutral-400 mb-6">Enter a name for your masterpiece to save it to your browser's local database.</p>
              <input
                autoFocus
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="e.g. Red Fire Tin"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all mb-6"
                onKeyDown={e => e.key === 'Enter' && handleSaveToDB()}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveToDB}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default App;
