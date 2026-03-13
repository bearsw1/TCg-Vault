import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, Box, PlusCircle, Heart, Search, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/collection', label: 'My Collection', icon: Library },
  { path: '/storage', label: 'Storage Locations', icon: Box },
  { path: '/add', label: 'Add Card', icon: PlusCircle },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/favorites', label: 'Favorites', icon: Heart },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
  const location = useLocation();
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex-col sticky top-0 h-screen transition-colors duration-300">
        <div className="p-6 border-bottom border-stone-100 dark:border-stone-800">
          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tight">TCG Vault</h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 font-mono uppercase tracking-widest mt-1">Inventory System</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium' 
                    : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/50 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 px-2 py-2 flex justify-around items-center z-50 transition-colors duration-300">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center p-2 rounded-lg ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-1 font-medium">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
