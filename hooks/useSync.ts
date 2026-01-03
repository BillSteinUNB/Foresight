import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { syncService } from '../lib/syncService';
import { useAuthStore } from '../stores/useAuthStore';

interface UseSyncOptions {
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

interface UseSyncReturn {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  handleSync: () => Promise<void>;
}

export const useSync = (options: UseSyncOptions = {}): UseSyncReturn => {
  const { onSyncComplete, onSyncError } = options;
  const { user } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const handleSync = useCallback(async () => {
    if (!user?.id || isSyncing) return;

    setIsSyncing(true);
    try {
      // Push local changes first, then pull remote
      await syncService.pushAll(user.id);
      await syncService.pullAll(user.id);
      setLastSyncTime(new Date());
      onSyncComplete?.();
    } catch (error) {
      onSyncError?.(error instanceof Error ? error : new Error('Sync failed'));
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, onSyncComplete, onSyncError]);

  return {
    isSyncing,
    lastSyncTime,
    handleSync,
  };
};
