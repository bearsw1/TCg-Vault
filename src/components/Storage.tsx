import React, { useState, useRef } from 'react';
import { localDb } from '../db';
import { StorageLocation, StorageType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Plus, Trash2, X, Camera, ChevronRight, MapPin, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Storage() {
  const locations = useLiveQuery(() => localDb.storageLocations.toArray()) || [];
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<StorageType>('Binder');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await localDb.storageLocations.add({
        name,
        type,
        description,
        photoUrl,
        totalCards: 0,
        createdAt: new Date(),
      } as any);
      setIsAdding(false);
      resetForm();
    } catch (err) {
      console.error("Error adding storage location:", err);
      alert("Failed to add storage location locally.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('Binder');
    setDescription('');
    setPhotoUrl(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this storage location? Cards inside will be unassigned.')) return;
    
    try {
      await localDb.storageLocations.delete(id);
      // Optional: Update cards to remove this locationId
      await localDb.cards.where('locationId').equals(id).modify({ locationId: undefined });
    } catch (err) {
      console.error("Error deleting storage location:", err);
    }
  };

  // Camera Logic
  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhotoUrl(dataUrl);
      stopCamera();
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Storage Locations</h2>
          <p className="text-stone-500 dark:text-stone-400">Visually organize your physical storage</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center space-x-2 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20"
        >
          <Plus size={20} />
          <span>New Location</span>
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-stone-900 dark:text-white">Add Storage Location</h3>
              <button onClick={() => { setIsAdding(false); resetForm(); }} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-2">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Location Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                    placeholder="e.g. Blue Zipper Binder"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Storage Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as StorageType)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  >
                    <option value="Binder">Binder</option>
                    <option value="Deck Box">Deck Box</option>
                    <option value="Storage Box">Storage Box</option>
                    <option value="Bulk Box">Bulk Box</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none h-32 bg-stone-50 dark:bg-stone-800 dark:text-white"
                    placeholder="Describe what's inside..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">Location Photo</label>
                  <div className="aspect-square bg-stone-50 dark:bg-stone-800 rounded-3xl border-2 border-dashed border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center relative overflow-hidden group">
                    {photoUrl ? (
                      <>
                        <img src={photoUrl} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button 
                            type="button"
                            onClick={startCamera}
                            className="p-3 bg-white rounded-full text-stone-900 shadow-lg hover:scale-110 transition-transform"
                          >
                            <Camera size={20} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPhotoUrl(null)}
                            className="p-3 bg-red-500 rounded-full text-white shadow-lg hover:scale-110 transition-transform"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon size={48} className="mx-auto text-stone-200 dark:text-stone-700 mb-4" />
                        <button 
                          type="button"
                          onClick={startCamera}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center justify-center space-x-2"
                        >
                          <Camera size={18} />
                          <span>Take Photo</span>
                        </button>
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">Visual thumbnail for this location</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {locations.map((loc, i) => (
          <Link key={loc.id} to={`/storage/${loc.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-900 hover:shadow-md transition-all h-full flex flex-col"
            >
              <div className="aspect-video bg-stone-50 dark:bg-stone-800 relative flex items-center justify-center text-stone-200 dark:text-stone-700 overflow-hidden">
                {loc.photoUrl ? (
                  <img src={loc.photoUrl} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Box size={48} />
                )}
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleDelete(e, loc.id)}
                    className="p-2 bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center space-x-1">
                    <MapPin size={10} />
                    <span>{loc.type}</span>
                  </span>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-bold text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{loc.name}</h4>
                  <ChevronRight size={18} className="text-stone-300 dark:text-stone-600 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-sm line-clamp-2 mb-4 flex-1">{loc.description || 'No description provided.'}</p>
                <div className="pt-4 border-t border-stone-50 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Cards Stored</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{loc.totalCards}</span>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
        
        {locations.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
            <Box size={48} className="mx-auto text-stone-200 dark:text-stone-800 mb-4" />
            <p className="text-stone-400 dark:text-stone-500 font-medium">No storage locations yet. Create your first binder or box!</p>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md aspect-[3/4] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-white/30 rounded-xl border-dashed" />
              </div>
              <div className="absolute top-6 right-6">
                <button onClick={stopCamera} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                  <X size={24} />
                </button>
              </div>
              <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                <button 
                  onClick={capturePhoto}
                  className="p-6 bg-emerald-500 rounded-full text-white shadow-2xl hover:bg-emerald-600 transition-all scale-110 active:scale-95"
                >
                  <Camera size={32} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
