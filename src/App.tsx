import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CollectionOverview from './components/CollectionOverview';
import CategoryView from './components/CategoryView';
import CardDetails from './components/CardDetails';
import Storage from './components/Storage';
import StorageDetails from './components/StorageDetails';
import AddCard from './components/AddCard';
import Profile from './components/Profile';
import Favorites from './components/Favorites';
import Search from './components/Search';
import { seedInitialData } from './db';

import Collection from './components/Collection';
import ErrorBoundary from './components/ErrorBoundary';

import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await seedInitialData();
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-emerald-500 rounded-full mb-4"></div>
          <p className="text-stone-500 dark:text-stone-400 font-medium">Loading TCG Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="collection" element={<CollectionOverview />} />
              <Route path="collection/all" element={<Collection />} />
              <Route path="collection/:gameId" element={<CategoryView />} />
              <Route path="card/:cardId" element={<CardDetails />} />
              <Route path="storage" element={<Storage />} />
              <Route path="storage/:locationId" element={<StorageDetails />} />
              <Route path="add" element={<AddCard />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="search" element={<Search />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
