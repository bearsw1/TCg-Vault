import React from 'react';
import { User, Shield, HardDrive } from 'lucide-react';

export default function Profile() {
  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-stone-900 tracking-tight">App Settings</h2>
        <p className="text-stone-500">Manage your local vault preferences</p>
      </header>

      <div className="space-y-6">
        <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center">
              <User size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-stone-900">Local Collector</h3>
              <p className="text-stone-500">Self-contained Offline Vault</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100">
              <div className="flex items-center space-x-3 text-stone-600">
                <HardDrive size={20} />
                <span className="text-sm font-medium">Storage Type</span>
              </div>
              <span className="text-sm font-bold text-stone-900">IndexedDB (Local)</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100">
              <div className="flex items-center space-x-3 text-stone-600">
                <Shield size={20} />
                <span className="text-sm font-medium">Privacy Mode</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-widest">100% Private</span>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900 mb-4">About TCG Vault</h3>
          <p className="text-stone-600 text-sm leading-relaxed">
            This application is running in fully self-contained mode. All your card data, photos, and storage locations are stored directly on this device. No data is sent to any external servers.
          </p>
        </section>
      </div>
    </div>
  );
}
