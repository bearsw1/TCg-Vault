import Dexie, { type Table } from 'dexie';
import { Card, StorageLocation, GameCategory } from './types';

export class TCGVaultDB extends Dexie {
  cards!: Table<Card>;
  storageLocations!: Table<StorageLocation>;
  games!: Table<GameCategory>;

  constructor() {
    super('TCGVaultDB');
    this.version(1).stores({
      cards: '++id, name, gameId, locationId, isFavorite, createdAt',
      storageLocations: '++id, name, type, createdAt',
      games: '++id, name, createdAt'
    });
  }
}

export const localDb = new TCGVaultDB();

// Helper to seed initial data if empty
export async function seedInitialData() {
  const gameCount = await localDb.games.count();
  if (gameCount === 0) {
    await localDb.games.bulkAdd([
      { name: 'Yu-Gi-Oh!', createdAt: new Date() } as any,
      { name: 'Pokémon', createdAt: new Date() } as any,
      { name: 'Magic: The Gathering', createdAt: new Date() } as any
    ]);
  }

  const locationCount = await localDb.storageLocations.count();
  if (locationCount === 0) {
    await localDb.storageLocations.add({
      name: 'Main Binder',
      type: 'Binder',
      totalCards: 0,
      createdAt: new Date()
    } as any);
  }
}
