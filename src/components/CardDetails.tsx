import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { localDb } from '../db';
import { Card, GameCategory, StorageLocation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Edit2, Trash2, Save, X, Camera, 
  Library, Box, Heart, Info, RefreshCw
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

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

export default function CardDetails() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const card = useLiveQuery(() => {
    const id = parseInt(cardId || '');
    return isNaN(id) ? Promise.resolve(undefined) : localDb.cards.get(id);
  }, [cardId]);
  const games = useLiveQuery(() => localDb.games.toArray()) || [];
  const locations = useLiveQuery(() => localDb.storageLocations.toArray()) || [];

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editGameId, setEditGameId] = useState('');
  const [editSetName, setEditSetName] = useState('');
  const [editCardNumber, setEditCardNumber] = useState('');
  const [editRarity, setEditRarity] = useState('');
  const [editCustomRarity, setEditCustomRarity] = useState('');
  const [editEdition, setEditEdition] = useState('');
  const [editCustomEdition, setEditCustomEdition] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editLocationId, setEditLocationId] = useState('');
  const [editBinderPage, setEditBinderPage] = useState<number | undefined>();
  const [editBinderSlot, setEditBinderSlot] = useState<number | undefined>();
  const [editNotes, setEditNotes] = useState('');
  const [editFrontPhoto, setEditFrontPhoto] = useState<string | null>(null);
  const [editBackPhoto, setEditBackPhoto] = useState<string | null>(null);

  // Camera State
  const [showCamera, setShowCamera] = useState<'front' | 'back' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (card) {
      setEditName(card.name);
      setEditGameId(card.gameId);
      setEditSetName(card.setName || '');
      setEditCardNumber(card.cardNumber || '');
      
      const gameOpts = DEFAULT_GAME_OPTIONS[card.gameId] || { rarities: [], editions: [] };
      
      if (card.rarity && !gameOpts.rarities.includes(card.rarity)) {
        setEditRarity('Other');
        setEditCustomRarity(card.rarity);
      } else {
        setEditRarity(card.rarity || '');
        setEditCustomRarity('');
      }

      if (card.edition && !gameOpts.editions.includes(card.edition)) {
        setEditEdition('Other');
        setEditCustomEdition(card.edition);
      } else {
        setEditEdition(card.edition || '');
        setEditCustomEdition('');
      }

      setEditCondition(card.condition || 'Near Mint');
      setEditQuantity(card.quantity);
      setEditLocationId(card.locationId || '');
      setEditBinderPage(card.binderPage);
      setEditBinderSlot(card.binderSlot);
      setEditNotes(card.notes || '');
      setEditFrontPhoto(card.frontPhotoUrl || null);
      setEditBackPhoto(card.backPhotoUrl || null);
    }
  }, [card]);

  const handleUpdate = async () => {
    const id = parseInt(cardId || '');
    if (!card || isNaN(id)) return;
    setSaving(true);

    try {
      const oldQuantity = card.quantity;
      const oldLocationId = card.locationId;

      await localDb.cards.update(id, {
        name: editName,
        gameId: editGameId,
        setName: editSetName,
        cardNumber: editCardNumber,
        rarity: editRarity === 'Other' ? editCustomRarity : editRarity,
        edition: editEdition === 'Other' ? editCustomEdition : editEdition,
        condition: editCondition,
        quantity: editQuantity,
        locationId: editLocationId ? Number(editLocationId) : undefined,
        binderPage: editBinderPage || null,
        binderSlot: editBinderSlot || null,
        notes: editNotes,
        frontPhotoUrl: editFrontPhoto,
        backPhotoUrl: editBackPhoto,
        updatedAt: new Date(),
      } as any);

      // Update location counts if changed
      if (oldLocationId !== editLocationId) {
        if (oldLocationId) {
          const loc = await localDb.storageLocations.get(oldLocationId);
          if (loc) {
            await localDb.storageLocations.update(oldLocationId, {
              totalCards: Math.max(0, (loc.totalCards || 0) - oldQuantity)
            });
          }
        }
        if (editLocationId) {
          const loc = await localDb.storageLocations.get(editLocationId);
          if (loc) {
            await localDb.storageLocations.update(editLocationId, {
              totalCards: (loc.totalCards || 0) + editQuantity
            });
          }
        }
      } else if (oldQuantity !== editQuantity && editLocationId) {
        const loc = await localDb.storageLocations.get(editLocationId);
        if (loc) {
          await localDb.storageLocations.update(editLocationId, {
            totalCards: (loc.totalCards || 0) + (editQuantity - oldQuantity)
          });
        }
      }

      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update card");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const id = parseInt(cardId || '');
    if (!card || isNaN(id)) return;

    try {
      await localDb.cards.delete(id);
      if (card.locationId) {
        const loc = await localDb.storageLocations.get(card.locationId);
        if (loc) {
          await localDb.storageLocations.update(card.locationId, {
            totalCards: Math.max(0, (loc.totalCards || 0) - card.quantity)
          });
        }
      }
      navigate('/collection');
    } catch (err) {
      console.error("Delete error:", err);
      // Using console.error instead of alert as per guidelines
    }
  };

  const toggleFavorite = async () => {
    const id = parseInt(cardId || '');
    if (isNaN(id) || !card) return;
    await localDb.cards.update(id, {
      isFavorite: !card.isFavorite
    });
  };

  // Camera Logic
  const startCamera = async (side: 'front' | 'back') => {
    setShowCamera(side);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied");
      setShowCamera(null);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setShowCamera(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && showCamera) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      if (showCamera === 'front') setEditFrontPhoto(dataUrl);
      else setEditBackPhoto(dataUrl);
      stopCamera();
    }
  };

  if (!card) return null;

  const currentLocation = locations.find(l => l.id === (isEditing ? editLocationId : card.locationId));
  const isBinder = currentLocation?.type === 'Binder';
  const gameOptions = DEFAULT_GAME_OPTIONS[editGameId] || { rarities: [], editions: [] };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-stone-500 dark:text-stone-400"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">Card Details</h2>
            <p className="text-stone-500 dark:text-stone-400">View and manage your card</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleFavorite}
            className={`p-3 rounded-2xl transition-all ${card.isFavorite ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-white dark:bg-stone-900 text-stone-400 border border-stone-100 dark:border-stone-800 shadow-sm'}`}
          >
            <Heart size={20} fill={card.isFavorite ? 'currentColor' : 'none'} />
          </button>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20"
            >
              <Edit2 size={20} />
              <span>Edit Card</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center space-x-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-6 py-3 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Photos */}
        <div className="space-y-6">
          <section className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 dark:text-white flex items-center space-x-2">
              <Camera size={18} className="text-emerald-600 dark:text-emerald-400" />
              <span>Card Photos</span>
            </h3>
            
            <div className="space-y-4">
              {/* Front Photo */}
              <div className="relative group">
                <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-2">Front View</p>
                <div className="aspect-[3/4] bg-stone-50 dark:bg-stone-800 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800 flex items-center justify-center relative">
                  {(isEditing ? editFrontPhoto : card.frontPhotoUrl) ? (
                    <img 
                      src={isEditing ? editFrontPhoto! : card.frontPhotoUrl!} 
                      className="w-full h-full object-cover" 
                      alt="Front"
                    />
                  ) : (
                    <Library size={48} className="text-stone-200 dark:text-stone-700" />
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => startCamera('front')}
                        className="p-3 bg-white rounded-full text-stone-900 shadow-lg hover:scale-110 transition-transform"
                      >
                        <RefreshCw size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Back Photo */}
              <div className="relative group">
                <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-2">Back View</p>
                <div className="aspect-[3/4] bg-stone-50 dark:bg-stone-800 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800 flex items-center justify-center relative">
                  {(isEditing ? editBackPhoto : card.backPhotoUrl) ? (
                    <img 
                      src={isEditing ? editBackPhoto! : card.backPhotoUrl!} 
                      className="w-full h-full object-cover" 
                      alt="Back"
                    />
                  ) : (
                    <Library size={48} className="text-stone-200 dark:text-stone-700" />
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => startCamera('back')}
                        className="p-3 bg-white rounded-full text-stone-900 shadow-lg hover:scale-110 transition-transform"
                      >
                        <RefreshCw size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Info */}
          <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-2">
              <Info size={20} />
              <h3 className="font-bold text-lg">Card Information</h3>
            </div>

            {isEditing ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Card Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Game Category</label>
                  <select
                    value={editGameId}
                    onChange={(e) => setEditGameId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  >
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
                    value={editSetName}
                    onChange={(e) => setEditSetName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={editCardNumber}
                    onChange={(e) => setEditCardNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                    placeholder="e.g. 001/100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Rarity</label>
                  <select
                    value={editRarity}
                    onChange={(e) => setEditRarity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  >
                    <option value="">Select Rarity</option>
                    {gameOptions.rarities.map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="Other">Other</option>
                  </select>
                  {editRarity === 'Other' && (
                    <input
                      type="text"
                      value={editCustomRarity}
                      onChange={(e) => setEditCustomRarity(e.target.value)}
                      placeholder="Enter custom rarity"
                      className="w-full mt-2 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Edition</label>
                  <select
                    value={editEdition}
                    onChange={(e) => setEditEdition(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  >
                    <option value="">Select Edition</option>
                    {gameOptions.editions.map(ed => <option key={ed} value={ed}>{ed}</option>)}
                    <option value="Other">Other</option>
                  </select>
                  {editEdition === 'Other' && (
                    <input
                      type="text"
                      value={editCustomEdition}
                      onChange={(e) => setEditCustomEdition(e.target.value)}
                      placeholder="Enter custom edition"
                      className="w-full mt-2 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Condition</label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value)}
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
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1">Name</p>
                  <p className="font-bold text-stone-900 dark:text-white">{card.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1">Game</p>
                  <p className="font-bold text-stone-900 dark:text-white uppercase">{card.gameId}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1">Set</p>
                  <p className="font-bold text-stone-900 dark:text-white">{card.setName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1">Rarity</p>
                  <p className="font-bold text-stone-900 dark:text-white">{card.rarity || 'Common'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1">Edition</p>
                  <p className="font-bold text-stone-900 dark:text-white">{card.edition || 'Unlimited'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1">Condition</p>
                  <p className="font-bold text-stone-900 dark:text-white">{card.condition}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-1">Quantity</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">x{card.quantity}</p>
                </div>
              </div>
            )}
          </section>

          {/* Location Info */}
          <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-2">
              <Box size={20} />
              <h3 className="font-bold text-lg">Storage & Placement</h3>
            </div>

            {isEditing ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Location</label>
                  <select
                    value={editLocationId}
                    onChange={(e) => setEditLocationId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                  >
                    <option value="">No Location</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                {isBinder && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Page</label>
                      <input
                        type="number"
                        value={editBinderPage || ''}
                        onChange={(e) => setEditBinderPage(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Slot</label>
                      <input
                        type="number"
                        min="1"
                        max="9"
                        value={editBinderSlot || ''}
                        onChange={(e) => setEditBinderSlot(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 dark:bg-stone-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-6 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                    <Box size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase">Current Location</p>
                    <p className="font-bold text-stone-900 dark:text-white">{currentLocation?.name || 'Not Assigned'}</p>
                  </div>
                </div>
                {card.binderPage && (
                  <div className="text-right">
                    <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase">Placement</p>
                    <p className="font-bold text-stone-900 dark:text-white">Page {card.binderPage}, Slot {card.binderSlot}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 dark:text-white">Notes</h3>
            {isEditing ? (
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px] bg-stone-50 dark:bg-stone-800 dark:text-white"
                placeholder="Add any additional details..."
              />
            ) : (
              <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                {card.notes || 'No notes added for this card.'}
              </p>
            )}
          </section>

          {isEditing && (
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/30 px-6 py-3 rounded-2xl transition-all"
              >
                <Trash2 size={20} />
                <span>Delete Card</span>
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/20"
              >
                <Save size={20} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-stone-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-stone-900 dark:text-white">Delete Card?</h3>
                <p className="text-stone-500 dark:text-stone-400">This action cannot be undone. This card will be permanently removed from your collection.</p>
              </div>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleDelete}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-red-900/20"
                >
                  Yes, Delete Card
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-2xl font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
