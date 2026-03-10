import { useState, useRef, type ChangeEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Download, Upload, Settings2 } from 'lucide-react';
import PixTinModel from './components/PixTinModel';
import FaceEditor from './components/FaceEditor';
import { useFaceTexture, FaceDimensions } from './hooks/useFaceTexture';
import { type TinConfig, type FaceConfig, type ImageItem } from './types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const saveDesign = () => {
    if (!canvasRef.current) return;
    const image = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'pix-tin-design.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={saveDesign}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 transition-colors px-4 py-2 rounded-lg font-medium shadow-lg"
          >
            <Download size={18} />
            Save Mockup
          </button>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="w-full md:w-96 bg-neutral-950 border-t md:border-t-0 md:border-l border-neutral-800 p-6 flex flex-col overflow-y-auto" style={{ maxHeight: '100vh' }}>
        <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          Pix Designer
        </h1>
        <p className="text-neutral-400 text-sm mb-6">Advanced customization</p>

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
                Trim
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-neutral-800 my-2" />

          {selectedTab === 'hardware' ? (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Hardware Colors</h3>

              <div className="flex items-center justify-between bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                <span className="text-sm font-medium text-neutral-300">Base Tin Color</span>
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

              <div className="flex items-center justify-between bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                <span className="text-sm font-medium text-neutral-300">Hinges Color</span>
                <input
                  type="color"
                  value={config.hinges}
                  onChange={e => setConfig(prev => ({ ...prev, hinges: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>

              <div className="flex items-center justify-between bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                <span className="text-sm font-medium text-neutral-300">Lid Separator Line Color</span>
                <input
                  type="color"
                  value={config.lidLine}
                  onChange={e => setConfig(prev => ({ ...prev, lidLine: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
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
                  aspectRatio={FaceDimensions[selectedTab as keyof typeof FaceDimensions].w / FaceDimensions[selectedTab as keyof typeof FaceDimensions].h}
                />
              </div>
            </div>
          )}
        </div>
      </div >
    </div >
  );
}

export default App;
