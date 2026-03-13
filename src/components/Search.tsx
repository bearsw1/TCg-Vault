import React, { useState } from 'react';
import { localDb } from '../db';
import { Card } from '../types';
import { motion } from 'motion/react';
import { Search as SearchIcon, Library, Box } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const cards = useLiveQuery(() => localDb.cards.toArray()) || [];

  const results = searchTerm.trim() === '' ? [] : cards.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.setName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rarity?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Smart Search</h2>
        <p className="text-stone-500">Find any card in your inventory instantly</p>
      </header>

      <div className="relative">
        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400" size={24} />
        <input
          type="text"
          autoFocus
          placeholder="Search by name, set, or rarity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-6 py-5 rounded-3xl border border-stone-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none bg-white shadow-xl shadow-stone-200/50 text-xl"
        />
      </div>

      <div className="space-y-4">
        {results.map((card) => (
          <Link key={card.id} to={`/card/${card.id}`}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between hover:border-emerald-200 transition-colors"
            >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-20 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0">
                {card.frontPhotoUrl ? (
                  <img src={card.frontPhotoUrl} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <Library size={24} />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-lg font-bold text-stone-900">{card.name}</h4>
                <p className="text-sm text-stone-500">{card.setName} • {card.rarity}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Box size={14} className="text-stone-400" />
                  <span className="text-xs text-stone-400 font-medium">Stored in Binder P{card.binderPage || '?'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-600">x{card.quantity}</p>
              <p className="text-[10px] text-stone-400 uppercase font-mono tracking-widest">Owned</p>
            </div>
          </motion.div>
        </Link>
      ))}

        {searchTerm.trim() !== '' && results.length === 0 && (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg">No cards found matching "{searchTerm}"</p>
          </div>
        )}

        {searchTerm.trim() === '' && (
          <div className="text-center py-20">
            <SearchIcon size={64} className="mx-auto text-stone-100 mb-4" />
            <p className="text-stone-300 text-lg font-medium">Start typing to search your vault</p>
          </div>
        )}
      </div>
    </div>
  );
}
