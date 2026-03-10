import localforage from 'localforage';
import { type TinConfig } from './types';

export interface SavedDesign {
    id: string;
    name: string;
    config: TinConfig;
    updatedAt: number;
}

localforage.config({
    name: 'Pix3DDesigner',
    storeName: 'designs',
});

export const saveDesignToDB = async (name: string, config: TinConfig): Promise<SavedDesign> => {
    const designs = await getSavedDesigns();
    const id = Date.now().toString();
    const newDesign: SavedDesign = { id, name, config, updatedAt: Date.now() };

    await localforage.setItem('designs', [...designs, newDesign]);
    return newDesign;
};

export const updateDesignInDB = async (id: string, name: string, config: TinConfig): Promise<SavedDesign | null> => {
    const designs = await getSavedDesigns();
    const index = designs.findIndex(d => d.id === id);
    if (index === -1) return null;

    designs[index] = { ...designs[index], name, config, updatedAt: Date.now() };
    await localforage.setItem('designs', designs);
    return designs[index];
};

export const getSavedDesigns = async (): Promise<SavedDesign[]> => {
    const designs = await localforage.getItem<SavedDesign[]>('designs');
    return designs || [];
};

export const deleteDesignFromDB = async (id: string): Promise<void> => {
    const designs = await getSavedDesigns();
    await localforage.setItem('designs', designs.filter(d => d.id !== id));
};
