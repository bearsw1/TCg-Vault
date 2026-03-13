import React from 'react';
import { localDb } from '../db';
import { Card } from '../types';
import { motion } from 'motion/react';
import { Heart, Library } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const cards = useLiveQuery(
    () => localDb.cards.where('isFavorite').equals(1).toArray()
  ) || [];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Favorites</h2>
        <p className="text-stone-500 dark:text-stone-400">Your most prized cards</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {cards.map((card) => (
          <Link key={card.id} to={`/card/${card.id}`}>
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col hover:border-emerald-200 dark:hover:border-emerald-900 hover:shadow-md transition-all h-full"
            >
            <div className="aspect-[3/4] bg-stone-100 dark:bg-stone-800 relative overflow-hidden">
              {card.frontPhotoUrl ? (
                <img src={card.frontPhotoUrl} alt={card.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700">
                  <Library size={48} />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <div className="p-2 bg-red-500 text-white rounded-lg shadow-sm">
                  <Heart size={16} fill="currentColor" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <h4 className="font-bold text-stone-900 dark:text-white text-sm line-clamp-1">{card.name}</h4>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 uppercase font-mono tracking-tighter">{card.setName}</p>
            </div>
          </motion.div>
        </Link>
      ))}
        {cards.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
            <Heart size={48} className="mx-auto text-stone-200 dark:text-stone-800 mb-4" />
            <p className="text-stone-400 dark:text-stone-500 font-medium">You haven't favorited any cards yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
