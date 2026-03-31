import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { onGetFiles, onGetFolders, onGetStorageStats } from '../slices/fileManager/thunk';

export const useFileManager = () => {
  const dispatch: any = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [storageStats, setStorageStats] = useState<any>(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await dispatch(onGetFolders());
      await dispatch(onGetFiles());
      
      const stats = await onGetStorageStats();
      setStorageStats(stats);
      
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return {
    loading,
    error,
    storageStats,
    refreshData: loadInitialData
  };
};