import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Cloud, Settings, X, HardDrive } from 'lucide-react';
import { syncService, SyncStatus } from '../services/syncService';

export default function SyncManager() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [remoteUrlInput, setRemoteUrlInput] = useState('');
  const [autoSyncInput, setAutoSyncInput] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((newStatus) => {
      setStatus(newStatus);
      setRemoteUrlInput(newStatus.remoteUrl);
      setAutoSyncInput(newStatus.autoSync);
    });
    return () => unsubscribe();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const result = await syncService.syncNow();
    setSyncing(false);
    if (result.success) {
      setSyncMessage({ type: 'success', text: result.message });
    } else {
      setSyncMessage({ type: 'error', text: result.message });
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    syncService.setRemoteUrl(remoteUrlInput);
    syncService.setAutoSync(autoSyncInput);
    setSyncMessage({ type: 'success', text: 'Sync configuration saved successfully!' });
  };

  const formatLastSync = (isoStr: string | null) => {
    if (!isoStr) return 'Never synced';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
    } catch {
      return 'Unknown';
    }
  };

  const isSqlite = status?.provider === 'sqlite';

  return (
    <>
      {/* Badge button in navigation header */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all shadow-2xs cursor-pointer bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
        title="Click to manage database & synchronization"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            syncing ? 'bg-amber-400' : isSqlite ? 'bg-blue-400' : 'bg-emerald-400'
          }`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            syncing ? 'bg-amber-500' : isSqlite ? 'bg-blue-500' : 'bg-emerald-500'
          }`}></span>
        </span>

        {isSqlite ? (
          <HardDrive size={14} className="text-blue-600 shrink-0" />
        ) : (
          <Cloud size={14} className="text-emerald-600 shrink-0" />
        )}

        <span className="hidden md:inline font-mono text-[11px] uppercase tracking-wider">
          {syncing ? 'Syncing...' : isSqlite ? 'Local SQLite' : 'Render DB'}
        </span>
      </button>

      {/* Sync Management Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">Database & Device Sync</h3>
                  <p className="text-xs text-slate-500">Local SQLite & Render Cloud PostgreSQL synchronization</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Database Status Card */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Active Storage Provider:</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isSqlite ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {isSqlite ? <HardDrive size={12} /> : <Cloud size={12} />}
                    {isSqlite ? 'Local SQLite Database' : 'Render Online PostgreSQL'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-slate-500 border-t border-slate-200/60">
                  <span>Last Synchronization:</span>
                  <span className="font-mono font-medium text-slate-700">{formatLastSync(status?.lastSyncedAt || null)}</span>
                </div>

                {status?.counts && (
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="block font-bold text-slate-900 text-sm">{status.counts.patients ?? 0}</span>
                      <span className="text-[10px] text-slate-500">Patients</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="block font-bold text-slate-900 text-sm">{status.counts.inventory ?? 0}</span>
                      <span className="text-[10px] text-slate-500">Inventory Items</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="block font-bold text-slate-900 text-sm">{status.counts.bills ?? 0}</span>
                      <span className="text-[10px] text-slate-500">Bills & Receipts</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {syncMessage && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                  syncMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {syncMessage.type === 'success' ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
                  )}
                  <span>{syncMessage.text}</span>
                </div>
              )}

              {/* Immediate Sync Trigger */}
              <div className="bg-blue-50/60 rounded-lg p-3.5 border border-blue-200/80 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-xs text-blue-900">Synchronize Devices Now</h4>
                  <p className="text-[11px] text-blue-700 leading-normal">
                    Pushes local SQLite sales & patient records to Render cloud, and pulls online updates.
                  </p>
                </div>
                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 shrink-0"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              {/* Settings Form */}
              <form onSubmit={handleSaveSettings} className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <Settings size={14} />
                  <span>Remote Cloud Server Configuration</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Render Server API Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={remoteUrlInput}
                    onChange={(e) => setRemoteUrlInput(e.target.value)}
                    placeholder="https://your-app.onrender.com"
                    required
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter the URL of your hosted Render application for cross-device database synchronization.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoSyncInput}
                      onChange={(e) => setAutoSyncInput(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Enable Automatic Background Sync</span>
                  </label>

                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
