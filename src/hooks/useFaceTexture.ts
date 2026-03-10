import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { type FaceConfig } from '../types';

export const FaceDimensions = {
    front: { w: 2.4, h: 4.8 },
    back: { w: 2.4, h: 4.8 },
    left: { w: 1.2, h: 4.8 },
    right: { w: 1.2, h: 4.8 },
    top: { w: 2.4, h: 1.2 },
    bottom: { w: 2.4, h: 1.2 },
};

export function useFaceTexture(face: keyof typeof FaceDimensions, config: FaceConfig) {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        let active = true;
        const canvas = document.createElement('canvas');
        const res = 512;
        const cw = FaceDimensions[face].w * res;
        const ch = FaceDimensions[face].h * res;
        canvas.width = Math.floor(cw);
        canvas.height = Math.floor(ch);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill background color
        ctx.fillStyle = config.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (config.images.length === 0) {
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            setTexture(tex);
            return;
        }

        let loaded = 0;
        const imgObjs = config.images.map(imgData => {
            const img = new Image();
            img.src = imgData.url;
            return { elem: img, data: imgData };
        });

        const draw = () => {
            if (!active) return;
            imgObjs.forEach(({ elem, data }) => {
                const drawW = canvas.width * data.scale;
                const drawH = drawW / data.aspectRatio;
                const cx = data.x * canvas.width;
                const cy = data.y * canvas.height;
                ctx.drawImage(elem, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
            });

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            setTexture(tex);
        };

        imgObjs.forEach(obj => {
            obj.elem.onload = () => {
                loaded++;
                if (loaded === imgObjs.length) draw();
            };
            obj.elem.onerror = () => {
                loaded++;
                if (loaded === imgObjs.length) draw();
            };
        });

        return () => { active = false; };
    }, [face, config]);

    return texture;
}
