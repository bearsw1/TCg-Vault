import React, { useState } from 'react';
import { localDb } from '../db';
import { Card, GameCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Library, ChevronRight, Layers, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

const DEFAULT_GAMES = [
  { id: 'yugioh', name: 'Yu-Gi-Oh!', icon: '🎴' },
  { id: 'pokemon', name: 'Pokémon', icon: '⚡' },
  { id: 'magic', name: 'Magic: The Gathering', icon: '🔥' },
];

export default function CollectionOverview() {
  const cards = useLiveQuery(() => localDb.cards.toArray()) || [];
  const customGames = useLiveQuery(() => localDb.games.toArray()) || [];
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameIcon, setNewGameIcon] = useState('🃏');
  const [savingGame, setSavingGame] = useState(false);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;
    setSavingGame(true);

    try {
      await localDb.games.add({
        name: newGameName.trim(),
        icon: newGameIcon,
        createdAt: new Date(),
      } as any);
      setIsAddingGame(false);
      setNewGameName('');
      setNewGameIcon('🃏');
    } catch (err) {
      console.error("Error adding game:", err);
      alert("Failed to add game locally.");
    } finally {
      setSavingGame(false);
    }
  };

  const allGameIds = Array.from(new Set([
    ...DEFAULT_GAMES.map(g => g.id),
    ...customGames.map(g => g.id),
    ...cards.map(c => c.gameId)
  ]));

  const categories = allGameIds.map(id => {
    const defaultGame = DEFAULT_GAMES.find(g => g.id === id);
    const customGame = customGames.find(g => g.id === id);
    const gameCards = cards.filter(c => c.gameId === id);
    
    return {
      id,
      name: defaultGame?.name || customGame?.name || String(id).charAt(0).toUpperCase() + String(id).slice(1),
      icon: defaultGame?.icon || customGame?.icon || '🃏',
      totalCards: gameCards.reduce((acc, c) => acc + c.quantity, 0),
      cardCount: gameCards.length
    };
  }).filter(cat => cat.totalCards > 0 || DEFAULT_GAMES.some(dg => dg.id === cat.id) || customGames.some(cg => cg.id === cat.id));

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">My Collection</h2>
          <p className="text-stone-500">Browse your cards by game category</p>
        </div>
        <button 
          onClick={() => setIsAddingGame(true)}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50"
        >
          <Plus size={20} />
          <span>Add Game</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <Link key={cat.id} to={`/collection/${cat.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-emerald-50 transition-colors">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">{cat.name}</h3>
                    <p className="text-stone-500 font-medium">Total Cards: {cat.totalCards}</p>
                    <p className="text-xs text-stone-400 mt-1">{cat.cardCount} unique entries</p>
                  </div>
                </div>
                <ChevronRight className="text-stone-300 group-hover:text-emerald-500 transition-colors" size={24} />
              </div>
              
              {/* Decorative background icon */}
              <div className="absolute -right-4 -bottom-4 text-stone-50 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Layers size={120} />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-stone-200">
          <Library size={48} className="mx-auto text-stone-200 mb-4" />
          <p className="text-stone-400 font-medium">Your collection is empty. Start by adding some cards!</p>
          <Link to="/add" className="mt-4 inline-flex items-center text-emerald-600 font-bold hover:underline">
            Add your first card <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {/* Add Game Modal */}
      <AnimatePresence>
        {isAddingGame && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-stone-900">Add New Game</h3>
                <button 
                  onClick={() => setIsAddingGame(false)} 
                  className="text-stone-400 hover:text-stone-600 p-2"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddGame} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wider">Game Name</label>
                  <input
                    type="text"
                    required
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50"
                    placeholder="e.g. Lorcana, One Piece..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2 uppercase tracking-wider">Icon / Emoji</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={newGameIcon}
                      onChange={(e) => setNewGameIcon(e.target.value)}
                      className="w-20 px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 text-center text-2xl"
                      maxLength={2}
                    />
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      {['🃏', '⚔️', '🛡️', '✨', '🐉', '🌑', '💧', '🍃', '☀️', '💀'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewGameIcon(emoji)}
                          className={`w-full aspect-square flex items-center justify-center rounded-lg border ${newGameIcon === emoji ? 'border-emerald-500 bg-emerald-50' : 'border-stone-100 hover:bg-stone-50'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingGame}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 disabled:opacity-50"
                >
                  {savingGame ? 'Adding...' : 'Add Game Category'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
