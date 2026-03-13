import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { localDb } from '../db';
import { Card, StorageLocation } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, Box, Library, MapPin, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

export default function StorageDetails() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const location = useLiveQuery(
    () => {
      const id = parseInt(locationId || '');
      return isNaN(id) ? Promise.resolve(undefined) : localDb.storageLocations.get(id);
    },
    [locationId]
  );

  const cards = useLiveQuery(
    () => {
      const id = parseInt(locationId || '');
      // locationId in cards table might be stored as string or number depending on how it was saved
      // Let's try to match both or ensure it's saved as number
      return isNaN(id) ? Promise.resolve([]) : localDb.cards.where('locationId').equals(id).or('locationId').equals(locationId!).toArray();
    },
    [locationId]
  ) || [];

  const handleDelete = async () => {
    const id = parseInt(locationId || '');
    if (isNaN(id) || !window.confirm('Are you sure you want to delete this storage location? Cards inside will be unassigned.')) return;
    
    setDeleting(true);

    try {
      // 1. Unassign cards from this location
      await localDb.cards.where('locationId').equals(id).or('locationId').equals(locationId!).modify({ locationId: undefined });
      
      // 2. Delete the location
      await localDb.storageLocations.delete(id);
      
      // 3. Navigate back
      navigate('/storage');
    } catch (err) {
      console.error('Failed to delete location:', err);
      setDeleting(false);
    }
  };

  if (!location) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/storage')}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-stone-900 tracking-tight">{location.name}</h2>
            <p className="text-stone-500">{location.type} • {cards.length} cards stored</p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center space-x-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          <Trash2 size={20} />
          <span>{deleting ? 'Deleting...' : 'Delete'}</span>
        </button>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Location Info Card */}
        <div className="space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
            <div className="aspect-square bg-stone-50 rounded-2xl overflow-hidden border border-stone-100 flex items-center justify-center">
              {location.photoUrl ? (
                <img src={location.photoUrl} className="w-full h-full object-cover" alt={location.name} />
              ) : (
                <Box size={64} className="text-stone-200" />
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-stone-600">
                <MapPin size={20} className="text-emerald-500" />
                <span className="font-medium">{location.type}</span>
              </div>
              {location.description && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-sm text-stone-600 leading-relaxed">{location.description}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Cards List */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-stone-900 flex items-center space-x-2">
                <Library size={20} className="text-emerald-600" />
                <span>Stored Cards</span>
              </h3>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                {cards.length} Entries
              </span>
            </div>

            <div className="space-y-3">
              {cards.map((card) => (
                <Link key={card.id} to={`/card/${card.id}`}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 bg-stone-50 hover:bg-emerald-50 rounded-2xl border border-stone-100 hover:border-emerald-100 transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-16 bg-white rounded-lg overflow-hidden border border-stone-100 flex-shrink-0">
                        {card.frontPhotoUrl && <img src={card.frontPhotoUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">{card.name}</h4>
                        <p className="text-xs text-stone-400 font-mono">{card.setName || 'Unknown Set'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">x{card.quantity}</p>
                      {card.binderPage && (
                        <p className="text-[10px] text-stone-400 uppercase font-bold">P{card.binderPage} S{card.binderSlot}</p>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}

              {cards.length === 0 && (
                <div className="py-12 text-center">
                  <Library size={40} className="mx-auto text-stone-200 mb-2" />
                  <p className="text-stone-400 font-medium">No cards assigned to this location yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
