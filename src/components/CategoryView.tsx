import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { localDb } from '../db';
import { Card, GameCategory } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, Library, Grid3X3, List, Search } from 'lucide-react';
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

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/collection')}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-stone-900 tracking-tight">
              {game?.name || gameId}
            </h2>
            <p className="text-stone-500">{cards.length} cards in this category</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-stone-200 shadow-sm">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <Grid3X3 size={20} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-stone-400 hover:text-stone-600'}`}
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
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm"
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
                className="group bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col hover:border-emerald-200 hover:shadow-md transition-all h-full"
              >
                <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden">
                  {card.frontPhotoUrl ? (
                    <img src={card.frontPhotoUrl} alt={card.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <Library size={48} />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                      x{card.quantity}
                    </span>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-bold text-stone-900 text-sm line-clamp-1 mb-1">{card.name}</h4>
                  <p className="text-[10px] text-stone-400 uppercase font-mono tracking-tighter mb-2">{card.setName || 'Unknown Set'}</p>
                  <div className="mt-auto pt-2 border-t border-stone-50 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-stone-400 uppercase">{card.rarity || 'Common'}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Card</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Set</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Rarity</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Qty</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredCards.map((card) => (
                <tr 
                  key={card.id} 
                  className="hover:bg-stone-50/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/card/${card.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-10 bg-stone-100 rounded overflow-hidden flex-shrink-0">
                        {card.frontPhotoUrl && <img src={card.frontPhotoUrl} className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-bold text-stone-900">{card.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">{card.setName}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">{card.rarity}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">x{card.quantity}</td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {card.locationId ? 'Stored' : 'Not Assigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCards.length === 0 && (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-stone-200">
          <Library size={48} className="mx-auto text-stone-200 mb-4" />
          <p className="text-stone-400 font-medium">No cards found in this category.</p>
        </div>
      )}
    </div>
  );
}
