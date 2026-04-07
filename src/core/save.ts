import { createEmptyBag, type BagState, type ForageItemId } from './inventory';

export type SaveData = {
  bag: BagState;
  kitchenInventory: Record<ForageItemId, number>;
  playerX: number;
  playerY: number;
};

const SAVE_KEY = 'caretaker.save.v1';

const defaultSave: SaveData = {
  bag: createEmptyBag(),
  kitchenInventory: {
    wild_herb: 0,
  },
  playerX: 200,
  playerY: 520,
};

export const loadSave = (): SaveData => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...defaultSave };

    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      bag: parsed.bag ?? defaultSave.bag,
      kitchenInventory: {
        wild_herb: parsed.kitchenInventory?.wild_herb ?? 0,
      },
      playerX: parsed.playerX ?? defaultSave.playerX,
      playerY: parsed.playerY ?? defaultSave.playerY,
    };
  } catch {
    return { ...defaultSave };
  }
};

export const writeSave = (save: SaveData): void => {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
};
