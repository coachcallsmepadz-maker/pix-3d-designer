import { useRef } from 'react';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three-stdlib';

extend({ RoundedBoxGeometry });

interface PixTinModelProps {
    textures: {
        front: THREE.Texture | null;
        back: THREE.Texture | null;
        left: THREE.Texture | null;
        right: THREE.Texture | null;
        top: THREE.Texture | null;
        bottom: THREE.Texture | null;
    };
    hingesColor: string;
    lidLineColor: string;
}

export default function PixTinModel({ textures, hingesColor, lidLineColor }: PixTinModelProps) {
    const groupRef = useRef<THREE.Group>(null);

    const width = 2.4;
    const height = 4.8;
    const depth = 1.2;

    const maps = [
        textures.right,
        textures.left,
        textures.top,
        textures.bottom,
        textures.front,
        textures.back,
    ];

    maps.forEach(m => {
        if (m) m.colorSpace = THREE.SRGBColorSpace;
    });

    return (
        <group ref={groupRef} dispose={null}>
            {/* Main Body */}
            <mesh castShadow receiveShadow>
                {/* Notice the lowercase roundedBoxGeometry, thanks to extend() */}
                {/* args: [width, height, depth, segments, radius] */}
                {/* @ts-ignore */}
                <roundedBoxGeometry args={[width, height, depth, 4, 0.15]} />
                {maps.map((map, i) => (
                    <meshStandardMaterial
                        key={i}
                        attach={`material-${i}`}
                        color="#ffffff"
                        map={map}
                        roughness={0.4}
                    />
                ))}
            </mesh>

            {/* Visual Lid Separation (A thin dark line) */}
            <mesh position={[0, height / 2 - 0.8, 0]}>
                <boxGeometry args={[width + 0.02, 0.02, depth + 0.02]} />
                <meshStandardMaterial color={lidLineColor} roughness={0.8} />
            </mesh>

            {/* Hinge 1 */}
            <mesh position={[-0.4, height / 2 - 0.8, -depth / 2 - 0.05]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
                <meshStandardMaterial color={hingesColor} roughness={0.5} />
            </mesh>

            {/* Hinge 2 */}
            <mesh position={[0.4, height / 2 - 0.8, -depth / 2 - 0.05]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
                <meshStandardMaterial color={hingesColor} roughness={0.5} />
            </mesh>
        </group>
    );
}
