import React, { useState } from 'react';
import { localDb } from '../db';
import { Card, GameCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Library, ChevronRight, Layers, Plus, X, Edit2, Trash2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

const DEFAULT_GAMES = [
  { id: 'yugioh', name: 'Yu-Gi-Oh!', icon: '🎴' },
  { id: 'pokemon', name: 'Pokémon', icon: '⚡' },
  { id: 'magic', name: 'Magic: The Gathering', icon: '🔥' },
];

export default function CollectionOverview() {
  const cards = useLiveQuery(() => localDb.cards.toArray()) || [];
  const games = useLiveQuery(() => localDb.games.toArray()) || [];
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameIcon, setNewGameIcon] = useState('🃏');
  const [savingGame, setSavingGame] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    } finally {
      setSavingGame(false);
    }
  };

  const handleDeleteGame = async (e: React.MouseEvent, gameId: number | string) => {
    e.preventDefault();
    e.stopPropagation();

    const gameCards = cards.filter(c => c.gameId === String(gameId) || c.gameId === gameId);
    const message = gameCards.length > 0 
      ? `This category contains ${gameCards.length} cards. Deleting the category will NOT delete the cards, but they will no longer be grouped under this game. Continue?`
      : `Delete this game category?`;

    if (!window.confirm(message)) return;

    try {
      await localDb.games.delete(gameId as any);
    } catch (err) {
      console.error("Error deleting game:", err);
    }
  };

  // Combine DB games and any unique gameIds found in cards that aren't in DB
  const cardGameIds = Array.from(new Set(cards.map(c => c.gameId)));
  
  const categories = games.map(g => {
    const gameCards = cards.filter(c => String(c.gameId) === String(g.id));
    return {
      id: g.id,
      name: g.name,
      icon: g.icon || '🃏',
      totalCards: gameCards.reduce((acc, c) => acc + (c.quantity || 0), 0),
      cardCount: gameCards.length
    };
  });

  // Add "Unknown" category for cards with gameIds not in DB
  const dbGameIds = new Set(games.map(g => String(g.id)));
  const unknownGameIds = cardGameIds.filter(id => id && !dbGameIds.has(String(id)));
  
  unknownGameIds.forEach(id => {
    const gameCards = cards.filter(c => c.gameId === id);
    categories.push({
      id: id,
      name: String(id).charAt(0).toUpperCase() + String(id).slice(1),
      icon: '❓',
      totalCards: gameCards.reduce((acc, c) => acc + (c.quantity || 0), 0),
      cardCount: gameCards.length
    });
  });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">My Collection</h2>
          <p className="text-stone-500 dark:text-stone-400">Browse your cards by game category</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              isEditing 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            {isEditing ? <Check size={20} /> : <Edit2 size={20} />}
            <span>{isEditing ? 'Done' : 'Edit'}</span>
          </button>
          <Link 
            to="/collection/all"
            className="flex items-center space-x-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-6 py-3 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
          >
            <Library size={20} />
            <span>View All</span>
          </Link>
          <button 
            onClick={() => setIsAddingGame(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20"
          >
            <Plus size={20} />
            <span>Add Game</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, i) => {
          const isInDb = games.some(g => g.id === cat.id);
          
          return (
            <Link key={cat.id} to={isEditing ? '#' : `/collection/${cat.id}`} onClick={(e) => isEditing && e.preventDefault()}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`group bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                  isEditing ? 'cursor-default' : 'cursor-pointer hover:border-emerald-100 dark:hover:border-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-stone-50 dark:bg-stone-800 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors">
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-stone-900 dark:text-white">{cat.name}</h3>
                      <p className="text-stone-500 dark:text-stone-400 font-medium">Total Cards: {cat.totalCards}</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{cat.cardCount} unique entries</p>
                    </div>
                  </div>
                  
                  {isEditing ? (
                    isInDb ? (
                      <button 
                        onClick={(e) => handleDeleteGame(e, cat.id!)}
                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    ) : (
                      <div className="p-3 text-stone-300 dark:text-stone-700 italic text-xs">Virtual</div>
                    )
                  ) : (
                    <ChevronRight className="text-stone-300 dark:text-stone-600 group-hover:text-emerald-500 transition-colors" size={24} />
                  )}
                </div>
                
                {/* Decorative background icon */}
                <div className="absolute -right-4 -bottom-4 text-stone-50 dark:text-stone-800 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.05] dark:group-hover:opacity-[0.1] transition-opacity pointer-events-none">
                  <Layers size={120} />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="py-20 text-center bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
          <Library size={48} className="mx-auto text-stone-200 dark:text-stone-800 mb-4" />
          <p className="text-stone-400 dark:text-stone-500 font-medium">Your collection is empty. Start by adding some cards!</p>
          <Link to="/add" className="mt-4 inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
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
              className="bg-white dark:bg-stone-900 w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-stone-900 dark:text-white">Add New Game</h3>
                <button 
                  onClick={() => setIsAddingGame(false)} 
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-2"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddGame} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Game Name</label>
                  <input
                    type="text"
                    required
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                    placeholder="e.g. Lorcana, One Piece..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Icon / Emoji</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={newGameIcon}
                      onChange={(e) => setNewGameIcon(e.target.value)}
                      className="w-20 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white text-center text-2xl"
                      maxLength={2}
                    />
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      {['🃏', '⚔️', '🛡️', '✨', '🐉', '🌑', '💧', '🍃', '☀️', '💀'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewGameIcon(emoji)}
                          className={`w-full aspect-square flex items-center justify-center rounded-lg border ${newGameIcon === emoji ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
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
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20 disabled:opacity-50"
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
