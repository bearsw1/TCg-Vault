import React, { useState } from 'react';
import { localDb } from '../db';
import { Card, GameCategory } from '../types';
import { motion } from 'motion/react';
import { Library, Search as SearchIcon, Filter, Trash2, Heart, Grid3X3, List } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Collection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const cards = useLiveQuery(() => localDb.cards.toArray()) || [];
  const games = useLiveQuery(() => localDb.games.toArray()) || [];

  const toggleFavorite = async (card: Card) => {
    await localDb.cards.update(card.id, {
      isFavorite: !card.isFavorite
    });
  };

  const handleDelete = async (card: Card) => {
    if (!window.confirm('Delete this card from your collection?')) return;
    
    await localDb.cards.delete(card.id);
    
    if (card.locationId) {
      const loc = await localDb.storageLocations.get(card.locationId);
      if (loc) {
        await localDb.storageLocations.update(card.locationId, {
          totalCards: Math.max(0, (loc.totalCards || 0) - card.quantity)
        });
      }
    }
  };

  const filteredCards = cards.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.setName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = selectedGame === 'all' || c.gameId === selectedGame;
    return matchesSearch && matchesGame;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">My Collection</h2>
          <p className="text-stone-500">{filteredCards.length} cards matching filters</p>
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

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or set..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm appearance-none"
          >
            <option value="all">All Games</option>
            <option value="yugioh">Yu-Gi-Oh!</option>
            <option value="pokemon">Pokémon</option>
            <option value="magic">Magic</option>
            {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {/* Card Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {filteredCards.map((card) => (
            <motion.div
              layout
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden">
                {card.frontPhotoUrl ? (
                  <img src={card.frontPhotoUrl} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <Library size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => toggleFavorite(card)}
                    className={`p-2 rounded-lg backdrop-blur-md shadow-sm transition-all ${card.isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-stone-400 hover:text-red-500'}`}
                  >
                    <Heart size={16} fill={card.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button 
                    onClick={() => handleDelete(card)}
                    className="p-2 bg-white/90 backdrop-blur-md text-stone-400 hover:text-red-600 rounded-lg shadow-sm transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                  {card.binderPage && (
                    <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                      P{card.binderPage}:S{card.binderSlot}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
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
                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-stone-50/50 transition-colors">
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
                    {card.binderPage ? `Page ${card.binderPage}, Slot ${card.binderSlot}` : 'General Storage'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => toggleFavorite(card)} className={card.isFavorite ? 'text-red-500' : 'text-stone-300'}>
                      <Heart size={18} fill={card.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => handleDelete(card)} className="text-stone-300 hover:text-red-500">
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
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-stone-200">
          <Library size={48} className="mx-auto text-stone-200 mb-4" />
          <p className="text-stone-400 font-medium">No cards found. Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
