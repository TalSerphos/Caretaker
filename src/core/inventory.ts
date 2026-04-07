export type ForageItemId = 'wild_herb';

export type BagState =
  | {
      mode: 'empty';
      forageSlots: [];
      sickAnimalId: null;
    }
  | {
      mode: 'forage';
      forageSlots: ForageItemId[];
      sickAnimalId: null;
    }
  | {
      mode: 'sick_animal';
      forageSlots: [];
      sickAnimalId: string;
    };

export const MAX_FORAGE_SLOTS = 4;

export const createEmptyBag = (): BagState => ({
  mode: 'empty',
  forageSlots: [],
  sickAnimalId: null,
});

export const canAddForageItem = (bag: BagState): boolean =>
  bag.mode !== 'sick_animal' && bag.forageSlots.length < MAX_FORAGE_SLOTS;

export const addForageItem = (
  bag: BagState,
  itemId: ForageItemId,
): BagState => {
  if (!canAddForageItem(bag)) return bag;

  const slots = [...bag.forageSlots, itemId];
  return {
    mode: 'forage',
    forageSlots: slots,
    sickAnimalId: null,
  };
};

export const removeForageItems = (bag: BagState, count: number): BagState => {
  if (bag.mode !== 'forage' || count <= 0) return bag;

  const remaining = bag.forageSlots.slice(count);
  if (remaining.length === 0) {
    return createEmptyBag();
  }

  return {
    mode: 'forage',
    forageSlots: remaining,
    sickAnimalId: null,
  };
};

export const countItem = (bag: BagState, itemId: ForageItemId): number =>
  bag.forageSlots.filter((id) => id === itemId).length;
