import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Cloud, Settings, X, HardDrive, Wifi, WifiOff, Clock, History, Trash2, Radio } from 'lucide-react';
import { syncService, SyncStatus } from '../services/syncService';

export default function SyncManager() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sync' | 'settings' | 'history'>('sync');

  const [remoteUrlInput, setRemoteUrlInput] = useState('');
  const [autoSyncInput, setAutoSyncInput] = useState(true);
  const [syncIntervalInput, setSyncIntervalInput] = useState(5);

  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);

  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((newStatus) => {
      setStatus(newStatus);
      setRemoteUrlInput(newStatus.remoteUrl);
      setAutoSyncInput(newStatus.autoSync);
      setSyncIntervalInput(newStatus.syncInterval);
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

  const handleTestConnection = async () => {
    setTesting(true);
    setTestMessage(null);
    const res = await syncService.testRemoteConnection(remoteUrlInput);
    setTesting(false);
    if (res.success) {
      setTestMessage({ type: 'success', text: res.message });
    } else {
      setTestMessage({ type: 'error', text: res.message });
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    syncService.setRemoteUrl(remoteUrlInput);
    syncService.setAutoSync(autoSyncInput);
    syncService.setSyncInterval(syncIntervalInput);
    setSyncMessage({ type: 'success', text: 'Sync configuration saved successfully!' });
  };

  const handleClearHistory = () => {
    syncService.clearHistory();
  };

  const formatTime = (isoStr: string | null) => {
    if (!isoStr) return 'Never';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
    } catch {
      return 'Unknown';
    }
  };

  const isSqlite = status?.provider === 'sqlite';
  const isNetworkOnline = status?.networkOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);

  return (
    <>
      {/* Navigation Bar Sync Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all shadow-2xs cursor-pointer bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
        title="Click to manage database & background synchronization"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            syncing ? 'bg-amber-400' : isNetworkOnline ? 'bg-emerald-400' : 'bg-rose-400'
          }`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            syncing ? 'bg-amber-500' : isNetworkOnline ? 'bg-emerald-500' : 'bg-rose-500'
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

        {isNetworkOnline ? (
          <Wifi size={12} className="text-emerald-500 shrink-0 ml-0.5" title="Network Connected" />
        ) : (
          <WifiOff size={12} className="text-rose-500 shrink-0 ml-0.5" title="Network Disconnected" />
        )}
      </button>

      {/* Sync Management Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
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
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/30 px-4 pt-2 text-xs font-medium text-slate-600 gap-2">
              <button
                onClick={() => setActiveTab('sync')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'sync'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <RefreshCw size={14} />
                <span>Sync Status</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Settings size={14} />
                <span>Configuration</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <History size={14} />
                <span>History ({status?.history?.length || 0})</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Tab 1: Sync Status & Manual Trigger */}
              {activeTab === 'sync' && (
                <>
                  {/* Database & Network Status Cards */}
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Storage Provider:</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isSqlite ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isSqlite ? <HardDrive size={12} /> : <Cloud size={12} />}
                        {isSqlite ? 'Local SQLite Engine' : 'Render Online PostgreSQL'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold">Network State:</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isNetworkOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isNetworkOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {isNetworkOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs text-slate-500 border-t border-slate-200/60">
                      <span>Last Synchronization:</span>
                      <span className="font-mono font-medium text-slate-700">{formatTime(status?.lastSyncedAt || null)}</span>
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
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {syncMessage.type === 'success' ? (
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                      ) : (
                        <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                      )}
                      <span>{syncMessage.text}</span>
                    </div>
                  )}

                  {/* Immediate Sync Trigger */}
                  <div className="bg-blue-50/70 rounded-lg p-3.5 border border-blue-200/80 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-xs text-blue-900">Synchronize Devices Now</h4>
                      <p className="text-[11px] text-blue-700 leading-normal">
                        Pushes local SQLite records to Render cloud, and pulls online updates.
                      </p>
                    </div>
                    <button
                      onClick={handleSyncNow}
                      disabled={syncing || !isNetworkOnline}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                </>
              )}

              {/* Tab 2: Remote Configuration */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Render Cloud Server API Endpoint
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={remoteUrlInput}
                        onChange={(e) => setRemoteUrlInput(e.target.value)}
                        placeholder="https://your-app.onrender.com"
                        required
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testing || !remoteUrlInput}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        <Radio size={12} className={testing ? 'animate-pulse text-amber-600' : 'text-blue-600'} />
                        {testing ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Target server URL used for automatic cross-device background synchronization.
                    </p>
                  </div>

                  {testMessage && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                      testMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {testMessage.type === 'success' ? (
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle size={14} className="shrink-0 text-rose-600" />
                      )}
                      <span className="leading-tight">{testMessage.text}</span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={autoSyncInput}
                          onChange={(e) => setAutoSyncInput(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Enable Automatic Background Sync</span>
                      </label>
                    </div>

                    {autoSyncInput && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <label className="text-xs text-slate-600 font-medium flex items-center gap-1">
                          <Clock size={12} />
                          <span>Sync Interval:</span>
                        </label>
                        <select
                          value={syncIntervalInput}
                          onChange={(e) => setSyncIntervalInput(parseInt(e.target.value, 10))}
                          className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={1}>Every 1 Minute</option>
                          <option value={5}>Every 5 Minutes</option>
                          <option value={15}>Every 15 Minutes</option>
                          <option value={30}>Every 30 Minutes</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: History & Logs */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Recent Synchronization Executions</span>
                    {status?.history && status.history.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Clear History</span>
                      </button>
                    )}
                  </div>

                  {status?.history && status.history.length > 0 ? (
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {status.history.map((log) => (
                        <div
                          key={log.id}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                            log.success
                              ? 'bg-slate-50 border-slate-200 text-slate-800'
                              : 'bg-rose-50/60 border-rose-200 text-rose-900'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                            <span>{formatTime(log.timestamp)}</span>
                            <span className={`px-1.5 py-0.5 rounded font-sans font-bold text-[10px] uppercase ${
                              log.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {log.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                          <p className="font-medium text-[11px] leading-tight">{log.message}</p>
                          {log.success && (log.localImportedRecords !== undefined || log.remoteImportedRecords !== undefined) && (
                            <div className="flex gap-3 text-[10px] text-slate-500 pt-0.5">
                              <span>Local Updated: <strong className="text-slate-700">{log.localImportedRecords || 0}</strong></span>
                              <span>Cloud Updated: <strong className="text-slate-700">{log.remoteImportedRecords || 0}</strong></span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <History size={28} className="mx-auto text-slate-300 mb-1" />
                      <p className="text-xs text-slate-500 font-medium">No sync history recorded yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
