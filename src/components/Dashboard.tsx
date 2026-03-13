import React from 'react';
import { localDb } from '../db';
import { Card, StorageLocation, GameCategory } from '../types';
import { motion } from 'motion/react';
import { Library, Box, Layers, Heart, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Dashboard() {
  const cards = useLiveQuery(() => localDb.cards.toArray()) || [];
  const locations = useLiveQuery(() => localDb.storageLocations.toArray()) || [];
  const games = useLiveQuery(() => localDb.games.toArray()) || [];

  const stats = [
    { label: 'Total Cards', value: cards.reduce((acc, c) => acc + (c.quantity || 0), 0), icon: Library, color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/collection' },
    { label: 'Games Tracked', value: games.length, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50', path: '/collection' },
    { label: 'Storage Units', value: locations.length, icon: Box, color: 'text-amber-600', bg: 'bg-amber-50', path: '/storage' },
    { label: 'Favorites', value: cards.filter(c => c.isFavorite).length, icon: Heart, color: 'text-red-600', bg: 'bg-red-50', path: '/favorites' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Dashboard</h2>
          <p className="text-stone-500">Overview of your TCG collection</p>
        </div>
        <Link 
          to="/add" 
          className="inline-flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50"
        >
          <Plus size={20} />
          <span>Add New Card</span>
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <Link key={stat.label} to={stat.path}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all cursor-pointer h-full"
            >
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon size={24} />
              </div>
              <p className="text-stone-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-stone-900 mt-1">{stat.value}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity / Quick Actions */}
        <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-stone-900">Recent Additions</h3>
            <Link to="/collection" className="text-emerald-600 text-sm font-semibold hover:underline flex items-center">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {cards.slice(0, 5).map((card) => (
              <div key={card.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-16 bg-stone-200 rounded-lg overflow-hidden flex-shrink-0">
                    {card.frontPhotoUrl ? (
                      <img src={card.frontPhotoUrl} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <Library size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{card.name}</p>
                    <p className="text-xs text-stone-500">{card.setName || 'Unknown Set'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">x{card.quantity}</p>
                  <p className="text-[10px] text-stone-400 uppercase font-mono">{card.rarity || 'Common'}</p>
                </div>
              </div>
            ))}
            {cards.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-400">No cards added yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Storage Overview */}
        <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-stone-900">Storage Locations</h3>
            <Link to="/storage" className="text-emerald-600 text-sm font-semibold hover:underline flex items-center">
              Manage <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {locations.slice(0, 4).map((loc) => (
              <div key={loc.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-stone-200 rounded-xl flex items-center justify-center text-stone-500">
                    <Box size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{loc.name}</p>
                    <p className="text-xs text-stone-500">{loc.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-900">{loc.totalCards} cards</p>
                </div>
              </div>
            ))}
            {locations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-400">No storage locations defined.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
