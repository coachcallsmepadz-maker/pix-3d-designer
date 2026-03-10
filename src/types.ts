export type ImageItem = {
    id: string;
    url: string;
    x: number; // 0-1
    y: number; // 0-1
    scale: number; // 0-2 (1 = 100% of face width)
    aspectRatio: number;
};

export type FaceConfig = {
    color: string;
    images: ImageItem[];
};

export type TinConfig = {
    baseColor: string;
    front: FaceConfig;
    back: FaceConfig;
    left: FaceConfig;
    right: FaceConfig;
    top: FaceConfig;
    bottom: FaceConfig;
    hinges: string;
    lidLine: string;
};
