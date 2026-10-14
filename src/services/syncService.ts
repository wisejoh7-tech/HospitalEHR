import { API_BASE } from './apiService';

export interface SyncStatus {
  provider: 'sqlite' | 'postgresql';
  status: 'online' | 'offline' | 'syncing';
  lastSyncedAt: string | null;
  remoteUrl: string;
  autoSync: boolean;
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
};

class SyncService {
  private remoteUrl: string;
  private autoSync: boolean;
  private lastSyncedAt: string | null;
  private listeners: Array<(status: SyncStatus) => void> = [];
  private autoSyncTimer: any = null;

  constructor() {
    this.remoteUrl = localStorage.getItem(STORAGE_KEYS.REMOTE_URL) || 'https://vivi-hospital.onrender.com';
    this.lastSyncedAt = localStorage.getItem(STORAGE_KEYS.LAST_SYNCED);
    this.autoSync = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) !== 'false';

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
        lastSyncedAt: this.lastSyncedAt,
        remoteUrl: this.remoteUrl,
        autoSync: this.autoSync,
        ...customStatus
      };
      this.listeners.forEach(l => l(fallback));
    });
  }

  public async fetchDbInfo(): Promise<SyncStatus> {
    try {
      const res = await fetch(`${API_BASE}/db/info`);
      if (!res.ok) throw new Error('Failed to fetch DB info');
      const data = await res.json();
      return {
        provider: data.provider || 'sqlite',
        status: navigator.onLine ? 'online' : 'offline',
        lastSyncedAt: this.lastSyncedAt,
        remoteUrl: this.remoteUrl,
        autoSync: this.autoSync,
        counts: data.counts
      };
    } catch {
      return {
        provider: 'sqlite',
        status: 'offline',
        lastSyncedAt: this.lastSyncedAt,
        remoteUrl: this.remoteUrl,
        autoSync: this.autoSync
      };
    }
  }

  public async syncNow(): Promise<{ success: boolean; message: string }> {
    this.notifyListeners({ status: 'syncing' });
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

      const now = new Date().toISOString();
      this.lastSyncedAt = now;
      localStorage.setItem(STORAGE_KEYS.LAST_SYNCED, now);

      this.notifyListeners({ status: 'online' });
      return {
        success: true,
        message: body.message || `Sync completed successfully`
      };
    } catch (err: any) {
      this.notifyListeners({ status: 'offline' });
      return {
        success: false,
        message: err.message || 'Synchronization failed'
      };
    }
  }

  private startAutoSync() {
    this.stopAutoSync();
    this.autoSyncTimer = setInterval(() => {
      if (navigator.onLine && this.remoteUrl) {
        this.syncNow().catch(() => {});
      }
    }, 5 * 60 * 1000);
  }

  private stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }
}

export const syncService = new SyncService();
