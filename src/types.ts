export type StorageType = 'Binder' | 'Deck Box' | 'Storage Box' | 'Bulk Box' | 'Custom';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  createdAt: any;
}

export interface GameCategory {
  id: number | string;
  name: string;
  icon?: string;
  rarityOptions?: string[];
  editionOptions?: string[];
  createdAt: any;
}

export interface StorageLocation {
  id: number;
  name: string;
  type: StorageType;
  photoUrl?: string;
  description?: string;
  totalCards: number;
  createdAt: any;
}

export interface Card {
  id: number;
  name: string;
  gameId: string;
  setName?: string;
  cardNumber?: string;
  rarity?: string;
  edition?: string;
  condition?: string;
  quantity: number;
  notes?: string;
  isFavorite: boolean;
  frontPhotoUrl?: string;
  backPhotoUrl?: string;
  locationId?: number;
  binderPage?: number;
  binderSlot?: number;
  createdAt: any;
  updatedAt?: any;
}
