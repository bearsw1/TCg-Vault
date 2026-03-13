import React from 'react';
import { User, Shield, HardDrive, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Profile() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">App Settings</h2>
        <p className="text-stone-500 dark:text-stone-400">Manage your local vault preferences</p>
      </header>

      <div className="space-y-6">
        <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center">
              <User size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-stone-900 dark:text-white">Local Collector</h3>
              <p className="text-stone-500 dark:text-stone-400">Self-contained Offline Vault</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center space-x-3 text-stone-600 dark:text-stone-400">
                <HardDrive size={20} />
                <span className="text-sm font-medium">Storage Type</span>
              </div>
              <span className="text-sm font-bold text-stone-900 dark:text-white">IndexedDB (Local)</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <div className="flex items-center space-x-3 text-stone-600 dark:text-stone-400">
                <Shield size={20} />
                <span className="text-sm font-medium">Privacy Mode</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md uppercase tracking-widest">100% Private</span>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-6">Appearance</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id as any)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-stone-400 hover:border-stone-200 dark:hover:border-stone-700'
                  }`}
                >
                  <Icon size={24} className="mb-2" />
                  <span className="text-sm font-bold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4">About TCG Vault</h3>
          <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
            This application is running in fully self-contained mode. All your card data, photos, and storage locations are stored directly on this device. No data is sent to any external servers.
          </p>
        </section>
      </div>
    </div>
  );
}
