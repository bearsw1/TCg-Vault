import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { localDb } from '../db';
import { Card, GameCategory } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, Library, Grid3X3, List, Search, Trash2, Heart } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

const DEFAULT_GAMES = [
  { id: 'yugioh', name: 'Yu-Gi-Oh!' },
  { id: 'pokemon', name: 'Pokémon' },
  { id: 'magic', name: 'Magic: The Gathering' },
];

export default function CategoryView() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);

  const cards = useLiveQuery(
    () => localDb.cards.where('gameId').equals(gameId || '').toArray(),
    [gameId]
  ) || [];

  const game = useLiveQuery(
    async () => {
      const defaultGame = DEFAULT_GAMES.find(g => g.id === gameId);
      if (defaultGame) return { id: defaultGame.id, name: defaultGame.name, createdAt: new Date() } as any;
      return await localDb.games.get(Number(gameId) || gameId || '');
    },
    [gameId]
  );

  const filteredCards = cards.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.setName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFavorite = async (e: React.MouseEvent, card: Card) => {
    e.preventDefault();
    e.stopPropagation();
    await localDb.cards.update(card.id, {
      isFavorite: !card.isFavorite
    });
  };

  const confirmDelete = async () => {
    if (!cardToDelete) return;
    
    await localDb.cards.delete(cardToDelete.id);
    
    if (cardToDelete.locationId) {
      const loc = await localDb.storageLocations.get(cardToDelete.locationId);
      if (loc) {
        await localDb.storageLocations.update(cardToDelete.locationId, {
          totalCards: Math.max(0, (loc.totalCards || 0) - cardToDelete.quantity)
        });
      }
    }
    setCardToDelete(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/collection')}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-stone-500 dark:text-stone-400"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
              {game?.name || gameId}
            </h2>
            <p className="text-stone-500 dark:text-stone-400">{cards.length} cards in this category</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white dark:bg-stone-900 p-1 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
          >
            <Grid3X3 size={20} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
          >
            <List size={20} />
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
        <input
          type="text"
          placeholder="Search within this category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-stone-900 dark:text-white shadow-sm"
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {filteredCards.map((card) => (
            <Link key={card.id} to={`/card/${card.id}`}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col hover:border-emerald-200 dark:hover:border-emerald-900 hover:shadow-md transition-all h-full"
              >
                <div className="aspect-[3/4] bg-stone-100 dark:bg-stone-800 relative overflow-hidden">
                  {card.frontPhotoUrl ? (
                    <img src={card.frontPhotoUrl} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700">
                      <Library size={48} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={(e) => toggleFavorite(e, card)}
                      className={`p-2 rounded-lg backdrop-blur-md shadow-sm transition-all ${card.isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-stone-800/90 text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400'}`}
                    >
                      <Heart size={14} fill={card.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCardToDelete(card);
                      }}
                      className="p-2 bg-white/90 dark:bg-stone-800/90 backdrop-blur-md text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg shadow-sm transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                      x{card.quantity}
                    </span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-bold text-stone-900 dark:text-white text-sm line-clamp-1 mb-1">{card.name}</h4>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-mono tracking-tighter mb-2">{card.setName || 'Unknown Set'}</p>
                  <div className="mt-auto pt-2 border-t border-stone-50 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase">{card.rarity || 'Common'}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Card</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Set</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Rarity</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Qty</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
              {filteredCards.map((card) => (
                <tr 
                  key={card.id} 
                  className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/card/${card.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-10 bg-stone-100 dark:bg-stone-800 rounded overflow-hidden flex-shrink-0">
                        {card.frontPhotoUrl && <img src={card.frontPhotoUrl} className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-bold text-stone-900 dark:text-white">{card.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500 dark:text-stone-400">{card.setName}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase">{card.rarity}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">x{card.quantity}</td>
                  <td className="px-6 py-4 text-sm text-stone-500 dark:text-stone-400">
                    {card.locationId ? 'Stored' : 'Not Assigned'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={(e) => toggleFavorite(e, card)} 
                      className={`transition-colors ${card.isFavorite ? 'text-red-500 dark:text-red-400' : 'text-stone-300 dark:text-stone-600 hover:text-red-400'}`}
                    >
                      <Heart size={18} fill={card.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCardToDelete(card);
                      }} 
                      className="text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCards.length === 0 && (
        <div className="py-20 text-center bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
          <Library size={48} className="mx-auto text-stone-200 dark:text-stone-800 mb-4" />
          <p className="text-stone-400 dark:text-stone-500 font-medium">No cards found in this category.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-100 dark:border-stone-800"
          >
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Delete Card?</h3>
            <p className="text-stone-500 dark:text-stone-400 mb-8">
              Are you sure you want to remove <span className="font-bold text-stone-900 dark:text-white">"{cardToDelete.name}"</span> from your collection? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setCardToDelete(null)}
                className="flex-1 px-6 py-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
