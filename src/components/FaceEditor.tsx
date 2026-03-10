import React, { useState, useRef } from 'react';
import { type FaceConfig } from '../types';
import { Trash2 } from 'lucide-react';

interface Props {
    face: string;
    config: FaceConfig;
    onChange: (newConfig: FaceConfig) => void;
    aspectRatio: number; // width / height
}

export default function FaceEditor({ face, config, onChange, aspectRatio }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const startDrag = (e: React.PointerEvent, id: string) => {
        e.preventDefault();
        setDraggingId(id);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onDragMove = (e: React.PointerEvent) => {
        if (!draggingId || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const newImages = config.images.map(img =>
            img.id === draggingId ? { ...img, x, y } : img
        );
        onChange({ ...config, images: newImages });
    };

    const endDrag = (e: React.PointerEvent) => {
        if (draggingId) {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            setDraggingId(null);
        }
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-300 capitalize">{face} Color</span>
                <div className="flex items-center">
                    <input
                        type="color"
                        value={config.color}
                        onChange={e => onChange({ ...config, color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                </div>
            </div>

            {config.images.length > 0 && (
                <div className="text-xs text-emerald-400/80 italic mb-1 bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
                    Drag images within the preview directly to position them on your 3D model!
                </div>
            )}

            <div
                className="relative w-full bg-neutral-800 border-2 border-neutral-700 overflow-hidden touch-none rounded"
                style={{ aspectRatio: `${aspectRatio}` }}
                ref={containerRef}
            >
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: config.color }} />

                {config.images.map(img => (
                    <div
                        key={img.id}
                        className="absolute cursor-move group touch-none"
                        style={{
                            left: `${img.x * 100}%`,
                            top: `${img.y * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            width: `${img.scale * 100}%`,
                            aspectRatio: `${img.aspectRatio}`
                        }}
                        onPointerDown={e => startDrag(e, img.id)}
                        onPointerMove={onDragMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                    >
                        <img src={img.url} draggable={false} className="w-full h-full object-contain pointer-events-none" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange({ ...config, images: config.images.filter(i => i.id !== img.id) });
                            }}
                            className="absolute -top-3 -right-3 bg-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto shadow-md"
                            title="Remove Image"
                        >
                            <Trash2 size={12} className="text-white" />
                        </button>
                    </div>
                ))
                }

                {
                    config.images.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500 italic pointer-events-none">
                            No images (Upload below)
                        </div>
                    )
                }
            </div >

            {
                config.images.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-neutral-800 mt-4">
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase mt-4">Resize Images</h4>
                        {config.images.map((img, i) => (
                            <div key={img.id} className="flex flex-col space-y-1 bg-neutral-900/50 p-2 rounded">
                                <div className="flex justify-between text-xs text-neutral-400">
                                    <span>Image {i + 1}</span>
                                    <span>{Math.round(img.scale * 100)}% wide</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="2" step="0.05"
                                    value={img.scale}
                                    onChange={e => {
                                        const newImages = config.images.map(item => item.id === img.id ? { ...item, scale: parseFloat(e.target.value) } : item);
                                        onChange({ ...config, images: newImages });
                                    }}
                                    className="w-full accent-teal-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    );
}
