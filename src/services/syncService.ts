import { API_BASE } from './apiService';

export interface SyncLog {
  id: string;
  timestamp: string;
  success: boolean;
  message: string;
  localImportedRecords?: number;
  remoteImportedRecords?: number;
}

export interface SyncStatus {
  provider: 'sqlite' | 'postgresql';
  status: 'online' | 'offline' | 'syncing';
  networkOnline: boolean;
  lastSyncedAt: string | null;
  remoteUrl: string;
  autoSync: boolean;
  syncInterval: number; // in minutes
  history: SyncLog[];
  counts?: {
    users?: number;
    patients?: number;
    inventory?: number;
    bills?: number;
    prescriptions?: number;
    appointments?: number;
  };
}

const STORAGE_KEYS = {
  REMOTE_URL: 'vivi_sync_remote_url',
  LAST_SYNCED: 'vivi_sync_last_synced',
  AUTO_SYNC: 'vivi_sync_auto_enabled',
  SYNC_INTERVAL: 'vivi_sync_interval',
  SYNC_HISTORY: 'vivi_sync_history',
};

class SyncService {
  private remoteUrl: string;
  private autoSync: boolean;
  private syncInterval: number; // in minutes
  private lastSyncedAt: string | null;
  private history: SyncLog[] = [];
  private listeners: Array<(status: SyncStatus) => void> = [];
  private autoSyncTimer: any = null;

  constructor() {
    this.remoteUrl = localStorage.getItem(STORAGE_KEYS.REMOTE_URL) || 'https://vivi-hospital.onrender.com';
    this.lastSyncedAt = localStorage.getItem(STORAGE_KEYS.LAST_SYNCED);
    this.autoSync = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) !== 'false';
    this.syncInterval = parseInt(localStorage.getItem(STORAGE_KEYS.SYNC_INTERVAL) || '5', 10);

    try {
      const storedHistory = localStorage.getItem(STORAGE_KEYS.SYNC_HISTORY);
      if (storedHistory) {
        this.history = JSON.parse(storedHistory);
      }
    } catch {
      this.history = [];
    }

    // Attach network event listeners for seamless online recovery
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyListeners({ networkOnline: true });
        if (this.autoSync && this.remoteUrl) {
          this.syncNow().catch(() => {});
        }
      });
      window.addEventListener('offline', () => {
        this.notifyListeners({ networkOnline: false, status: 'offline' });
      });
    }

    if (this.autoSync) {
      this.startAutoSync();
    }
  }

  public getRemoteUrl(): string {
    return this.remoteUrl;
  }

  public setRemoteUrl(url: string) {
    this.remoteUrl = url.trim();
    localStorage.setItem(STORAGE_KEYS.REMOTE_URL, this.remoteUrl);
    this.notifyListeners();
  }

  public isAutoSyncEnabled(): boolean {
    return this.autoSync;
  }

  public setAutoSync(enabled: boolean) {
    this.autoSync = enabled;
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, String(enabled));
    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
    this.notifyListeners();
  }

  public getSyncInterval(): number {
    return this.syncInterval;
  }

  public setSyncInterval(minutes: number) {
    this.syncInterval = minutes > 0 ? minutes : 5;
    localStorage.setItem(STORAGE_KEYS.SYNC_INTERVAL, String(this.syncInterval));
    if (this.autoSync) {
      this.startAutoSync();
    }
    this.notifyListeners();
  }

  public getHistory(): SyncLog[] {
    return [...this.history];
  }

  public clearHistory() {
    this.history = [];
    localStorage.removeItem(STORAGE_KEYS.SYNC_HISTORY);
    this.notifyListeners();
  }

  private addHistoryLog(log: Omit<SyncLog, 'id'>) {
    const newLog: SyncLog = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      ...log
    };
    this.history = [newLog, ...this.history].slice(0, 30); // keep max 30 entries
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_HISTORY, JSON.stringify(this.history));
    } catch {
      // Ignore storage errors
    }
  }

  public async testRemoteConnection(targetUrl?: string): Promise<{ success: boolean; message: string; provider?: string }> {
    const urlToTest = (targetUrl || this.remoteUrl).trim();
    if (!urlToTest) {
      return { success: false, message: 'Please enter a valid remote server URL' };
    }

    const cleanUrl = urlToTest.replace(/\/+$/, '');
    const endpoint = `${cleanUrl.endsWith('/api') ? cleanUrl : cleanUrl + '/api'}/db/info`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return {
        success: true,
        message: `Connected successfully! Database provider: ${data.provider || 'PostgreSQL'}`,
        provider: data.provider
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.name === 'AbortError' ? 'Connection timed out (server unreachable)' : (err.message || 'Failed to connect to remote server')
      };
    }
  }

  public subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    this.fetchDbInfo().then(info => listener(info)).catch(() => {});
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(customStatus?: Partial<SyncStatus>) {
    this.fetchDbInfo().then(info => {
      const merged = { ...info, ...customStatus };
      this.listeners.forEach(l => l(merged));
    }).catch(() => {
      const fallback: SyncStatus = {
        provider: 'sqlite',
        status: 'offline',
        networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        lastSyncedAt: this.lastSyncedAt,
        remoteUrl: this.remoteUrl,
        autoSync: this.autoSync,
        syncInterval: this.syncInterval,
        history: this.history,
        ...customStatus
      };
      this.listeners.forEach(l => l(fallback));
    });
  }

  public async fetchDbInfo(): Promise<SyncStatus> {
    const networkOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    try {
      const res = await fetch(`${API_BASE}/db/info`);
      if (!res.ok) throw new Error('Failed to fetch DB info');
      const data = await res.json();
      return {
        provider: data.provider || 'sqlite',
        status: networkOnline ? 'online' : 'offline',
        networkOnline,
        lastSyncedAt: this.lastSyncedAt,
        remoteUrl: this.remoteUrl,
        autoSync: this.autoSync,
        syncInterval: this.syncInterval,
        history: this.history,
        counts: data.counts
      };
    } catch {
      return {
        provider: 'sqlite',
        status: 'offline',
        networkOnline,
        lastSyncedAt: this.lastSyncedAt,
        remoteUrl: this.remoteUrl,
        autoSync: this.autoSync,
        syncInterval: this.syncInterval,
        history: this.history
      };
    }
  }

  public async syncNow(): Promise<{ success: boolean; message: string }> {
    this.notifyListeners({ status: 'syncing' });
    const now = new Date().toISOString();

    try {
      const res = await fetch(`${API_BASE}/sync/sync-remote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remoteUrl: this.remoteUrl })
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || 'Synchronization failed');
      }

      this.lastSyncedAt = now;
      localStorage.setItem(STORAGE_KEYS.LAST_SYNCED, now);

      const successMsg = body.message || 'Bidirectional sync completed successfully';
      this.addHistoryLog({
        timestamp: now,
        success: true,
        message: successMsg,
        localImportedRecords: body.localImportedRecords || 0,
        remoteImportedRecords: body.remoteImportedRecords || 0
      });

      this.notifyListeners({ status: 'online' });
      return {
        success: true,
        message: successMsg
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Synchronization failed';
      this.addHistoryLog({
        timestamp: now,
        success: false,
        message: errorMsg
      });

      this.notifyListeners({ status: 'offline' });
      return {
        success: false,
        message: errorMsg
      };
    }
  }

  private startAutoSync() {
    this.stopAutoSync();
    const intervalMs = Math.max(1, this.syncInterval) * 60 * 1000;
    this.autoSyncTimer = setInterval(() => {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline && this.remoteUrl) {
        this.syncNow().catch(() => {});
      }
    }, intervalMs);
  }

  private stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }
}

export const syncService = new SyncService();
