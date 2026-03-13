import React, { useState, useEffect, useRef } from 'react';
import { localDb } from '../db';
import { GameCategory, StorageLocation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Camera, Save, X, Layers, Box, Grid3X3, RefreshCw, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { scanCardImage } from '../services/geminiService';

const DEFAULT_GAME_OPTIONS: Record<string, { rarities: string[], editions: string[] }> = {
  yugioh: {
    rarities: ['Common', 'Rare', 'Super Rare', 'Ultra Rare', 'Secret Rare', 'Ultimate Rare', 'Ghost Rare', 'Starlight Rare', 'Prismatic Secret Rare', 'Collector\'s Rare'],
    editions: ['1st Edition', 'Unlimited', 'Limited Edition', 'Duel Terminal']
  },
  pokemon: {
    rarities: ['Common', 'Uncommon', 'Rare', 'Holo Rare', 'Reverse Holo', 'Ultra Rare', 'Secret Rare', 'Full Art', 'Rainbow Rare', 'Shiny Rare', 'Illustration Rare'],
    editions: ['1st Edition', 'Unlimited', 'Shadowless', 'Promo']
  },
  magic: {
    rarities: ['Common', 'Uncommon', 'Rare', 'Mythic Rare', 'Special', 'Land'],
    editions: ['Standard', 'Foil', 'Etched Foil', 'Extended Art', 'Borderless', 'Showcase']
  }
};

export default function AddCard() {
  const navigate = useNavigate();
  const games = useLiveQuery(() => localDb.games.toArray()) || [];
  const locations = useLiveQuery(() => localDb.storageLocations.toArray()) || [];
  const [loading, setLoading] = useState(false);

  // Camera State
  const [showCamera, setShowCamera] = useState<'front' | 'back' | null>(null);
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [cardSetName, setCardSetName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [rarity, setRarity] = useState('');
  const [customRarity, setCustomRarity] = useState('');
  const [edition, setEdition] = useState('');
  const [customEdition, setCustomEdition] = useState('');
  const [condition, setCondition] = useState('Near Mint');
  const [quantity, setQuantity] = useState(1);
  const [locationId, setLocationId] = useState('');
  const [binderPage, setBinderPage] = useState<number | undefined>();
  const [binderSlot, setBinderSlot] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Auto-scan when front photo is taken
  useEffect(() => {
    if (frontPhoto && !name) {
      handleAutoScan(frontPhoto);
    }
  }, [frontPhoto]);

  const handleAutoScan = async (photo: string) => {
    setIsScanning(true);
    try {
      const data = await scanCardImage(photo);
      if (data) {
        setName(data.name || '');
        setGameId(data.gameId || '');
        setCardSetName(data.setName || '');
        setCardNumber(data.cardNumber || '');
        
        // Try to match rarity and edition from options
        const options = DEFAULT_GAME_OPTIONS[data.gameId] || { rarities: [], editions: [] };
        if (options.rarities.includes(data.rarity)) {
          setRarity(data.rarity);
        } else if (data.rarity) {
          setRarity('Other');
          setCustomRarity(data.rarity);
        }

        if (options.editions.includes(data.edition)) {
          setEdition(data.edition);
        } else if (data.edition) {
          setEdition('Other');
          setCustomEdition(data.edition);
        }
      }
    } catch (err) {
      console.error("Auto-scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Camera Logic
  const startCamera = async (side: 'front' | 'back') => {
    setShowCamera(side);
    try {
      // Try environment camera first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (e) {
        console.warn("Environment camera failed, falling back to any video device", e);
        // Fallback to any available video device
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure you have granted permission and that your device has a camera.");
      setShowCamera(null);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (side === 'front') setFrontPhoto(dataUrl);
        else setBackPhoto(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && showCamera) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (showCamera === 'front') setFrontPhoto(dataUrl);
        else setBackPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const numericLocationId = locationId ? parseInt(locationId as string) : null;
      
      await localDb.cards.add({
        name,
        gameId,
        setName: cardSetName,
        cardNumber,
        rarity: rarity === 'Other' ? customRarity : rarity,
        edition: edition === 'Other' ? customEdition : edition,
        condition,
        quantity,
        locationId: numericLocationId,
        binderPage: binderPage || null,
        binderSlot: binderSlot || null,
        notes,
        isFavorite,
        frontPhotoUrl: frontPhoto,
        backPhotoUrl: backPhoto,
        createdAt: new Date(),
      } as any);

      // Update location count
      if (numericLocationId) {
        const loc = await localDb.storageLocations.get(numericLocationId);
        if (loc) {
          await localDb.storageLocations.update(numericLocationId, {
            totalCards: (loc.totalCards || 0) + quantity
          });
        }
      }

      navigate('/collection');
    } catch (err) {
      console.error("Error saving card:", err);
      alert("Failed to save card locally.");
    } finally {
      setLoading(false);
    }
  };

  const selectedLocation = locations.find(l => l.id === (locationId ? Number(locationId) : null));
  const isBinder = selectedLocation?.type === 'Binder';

  // Dynamic Options
  const currentGame = games.find(g => g.id === Number(gameId));
  const gameOptions = DEFAULT_GAME_OPTIONS[gameId] || { 
    rarities: currentGame?.rarityOptions || [], 
    editions: currentGame?.editionOptions || [] 
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Add New Card</h2>
        <p className="text-stone-500 dark:text-stone-400">Add a card to your inventory</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Section */}
        <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <Camera size={20} />
            <h3 className="font-bold text-lg">Card Photos</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Front Photo */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest text-center">Front View</p>
              <div className="flex flex-col items-center justify-center">
                {frontPhoto ? (
                  <div className="relative w-full max-w-[200px] aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-stone-800 group">
                    <img src={frontPhoto} alt="Front" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
                      <button
                        type="button"
                        onClick={() => handleAutoScan(frontPhoto)}
                        disabled={isScanning}
                        className="p-2 bg-emerald-500 rounded-lg text-white shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                        title="Re-scan card"
                      >
                        {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => startCamera('front')}
                        className="p-2 bg-white rounded-lg text-stone-900 shadow-lg hover:scale-105 transition-transform"
                        title="Take Photo"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <label className="p-2 bg-white rounded-lg text-stone-900 shadow-lg hover:scale-105 transition-transform cursor-pointer" title="Upload Photo">
                        <Plus size={18} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFrontPhoto(null)}
                        className="p-2 bg-red-500 rounded-lg text-white shadow-lg hover:scale-105 transition-transform"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-[200px] space-y-2">
                    <button
                      type="button"
                      onClick={() => startCamera('front')}
                      className="w-full aspect-[3/4] border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all group"
                    >
                      <Camera size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-sm">Scan or Upload Front</span>
                    </button>
                    <label className="w-full py-2 border border-stone-200 dark:border-stone-800 rounded-xl flex items-center justify-center space-x-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors">
                      <Plus size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Upload File</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Back Photo */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest text-center">Back View</p>
              <div className="flex flex-col items-center justify-center">
                {backPhoto ? (
                  <div className="relative w-full max-w-[200px] aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-stone-800 group">
                    <img src={backPhoto} alt="Back" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
                      <button
                        type="button"
                        onClick={() => startCamera('back')}
                        className="p-2 bg-white rounded-lg text-stone-900 shadow-lg hover:scale-105 transition-transform"
                        title="Take Photo"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <label className="p-2 bg-white rounded-lg text-stone-900 shadow-lg hover:scale-105 transition-transform cursor-pointer" title="Upload Photo">
                        <Plus size={18} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setBackPhoto(null)}
                        className="p-2 bg-red-500 rounded-lg text-white shadow-lg hover:scale-105 transition-transform"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-[200px] space-y-2">
                    <button
                      type="button"
                      onClick={() => startCamera('back')}
                      className="w-full aspect-[3/4] border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl flex flex-col items-center justify-center text-stone-400 dark:text-stone-600 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all group"
                    >
                      <Camera size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-sm">Scan or Upload Back</span>
                    </button>
                    <label className="w-full py-2 border border-stone-200 dark:border-stone-800 rounded-xl flex items-center justify-center space-x-2 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors">
                      <Plus size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Upload File</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera Modal */}
          <AnimatePresence>
            {showCamera && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
              >
                <div className="relative w-full max-w-md aspect-[3/4] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none">
                    <div className="w-full h-full border-2 border-white/30 rounded-xl border-dashed" />
                  </div>
                  <div className="absolute top-6 right-6">
                    <button type="button" onClick={stopCamera} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center space-x-6">
                    <label className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 cursor-pointer transition-all" title="Upload from Gallery">
                      <Plus size={24} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        handleFileUpload(e, showCamera);
                        stopCamera();
                      }} />
                    </label>
                    <button 
                      type="button"
                      onClick={capturePhoto}
                      className="p-6 bg-emerald-500 rounded-full text-white shadow-2xl hover:bg-emerald-600 transition-all scale-110 active:scale-95"
                    >
                      <Camera size={32} />
                    </button>
                    <div className="w-14" /> {/* Spacer to balance the layout */}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <canvas ref={canvasRef} className="hidden" />
        </section>

        {/* Basic Info */}
        <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <Layers size={20} />
            <h3 className="font-bold text-lg">Basic Information</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">Card Name</label>
                {isScanning && (
                  <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-pulse">
                    <Loader2 size={14} className="animate-spin" />
                    <Sparkles size={14} />
                    <span>AI Scanning Card Details...</span>
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-stone-50 dark:bg-stone-800 dark:text-white ${isScanning ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : ''}`}
                  placeholder={isScanning ? "Scanning..." : "e.g. Blue-Eyes White Dragon"}
                />
                {isScanning && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 size={20} className="text-emerald-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Game Category</label>
              <select
                required
                value={gameId}
                onChange={(e) => {
                  setGameId(e.target.value);
                  setRarity('');
                  setEdition('');
                  setCustomRarity('');
                  setCustomEdition('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
              >
                <option value="">Select Game</option>
                <option value="yugioh">Yu-Gi-Oh!</option>
                <option value="pokemon">Pokémon</option>
                <option value="magic">Magic: The Gathering</option>
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Set Name</label>
              <input
                type="text"
                value={cardSetName}
                onChange={(e) => setCardSetName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                placeholder="e.g. Legend of Blue Eyes"
              />
            </div>
          </div>
        </section>

        {/* Card Details */}
        <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-2">
            <Plus size={20} />
            <h3 className="font-bold text-lg">Card Details</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className={rarity === 'Other' ? 'col-span-1' : 'col-span-1'}>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Rarity</label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
              >
                <option value="">Select Rarity</option>
                {gameOptions.rarities.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="Other">Other</option>
              </select>
              {rarity === 'Other' && (
                <input
                  type="text"
                  value={customRarity}
                  onChange={(e) => setCustomRarity(e.target.value)}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-stone-50 dark:bg-stone-800 dark:text-white"
                  placeholder="Enter custom rarity"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Edition</label>
              <select
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
              >
                <option value="">Select Edition</option>
                {gameOptions.editions.map(ed => <option key={ed} value={ed}>{ed}</option>)}
                <option value="Other">Other</option>
              </select>
              {edition === 'Other' && (
                <input
                  type="text"
                  value={customEdition}
                  onChange={(e) => setCustomEdition(e.target.value)}
                  className="mt-2 w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-stone-50 dark:bg-stone-800 dark:text-white"
                  placeholder="Enter custom edition"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
              >
                <option>Near Mint</option>
                <option>Lightly Played</option>
                <option>Moderately Played</option>
                <option>Heavily Played</option>
                <option>Damaged</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Location Data */}
        <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-2">
            <Box size={20} />
            <h3 className="font-bold text-lg">Storage & Placement</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Storage Location</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
              >
                <option value="">Select Location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.type})</option>)}
              </select>
            </div>
            
            {isBinder && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Page</label>
                  <input
                    type="number"
                    min="1"
                    value={binderPage || ''}
                    onChange={(e) => setBinderPage(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Slot (1-9)</label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={binderSlot || ''}
                    onChange={(e) => setBinderSlot(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {isBinder && binderPage && (
            <div className="mt-4 p-6 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
              <p className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-4 flex items-center">
                <Grid3X3 size={16} className="mr-2" /> 3x3 Binder Layout (Page {binderPage})
              </p>
              <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(slot => (
                  <div 
                    key={slot}
                    onClick={() => setBinderSlot(slot)}
                    className={`aspect-[3/4] rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                      binderSlot === slot 
                        ? 'bg-emerald-500 border-emerald-600 text-white shadow-md scale-105' 
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600 hover:border-stone-400 dark:hover:border-stone-500'
                    }`}
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-8 py-3 rounded-2xl font-semibold text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white px-12 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20 flex items-center space-x-2"
          >
            <Save size={20} />
            <span>{loading ? 'Saving Card...' : 'Save to Vault'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
