export type SaveData = {
  bagIngredientCount: number;
  playerX: number;
  playerY: number;
};

const SAVE_KEY = 'caretaker.save.v1';

const defaultSave: SaveData = {
  bagIngredientCount: 0,
  playerX: 200,
  playerY: 520,
};

export const loadSave = (): SaveData => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...defaultSave };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      bagIngredientCount:
        parsed.bagIngredientCount ?? defaultSave.bagIngredientCount,
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
