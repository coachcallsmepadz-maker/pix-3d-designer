import { useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

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

    // We set base color to white, because the canvas textures have the base color baked in.
    const materials = [
        new THREE.MeshStandardMaterial({ color: '#ffffff', map: textures.right, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: '#ffffff', map: textures.left, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: '#ffffff', map: textures.top, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: '#ffffff', map: textures.bottom, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: '#ffffff', map: textures.front, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: '#ffffff', map: textures.back, roughness: 0.4 }),
    ];

    materials.forEach(m => {
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
    });

    return (
        <group ref={groupRef} dispose={null}>
            {/* Main Body */}
            <RoundedBox args={[width, height, depth]} radius={0.15} smoothness={4} castShadow receiveShadow>
                {materials.map((mat, i) => (
                    <primitive key={i} object={mat} attach={`material-${i}`} />
                ))}
            </RoundedBox>

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
