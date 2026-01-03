import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { exportData, ExportFormat, ExportData } from '../utils/exportData';

interface UseExportOptions {
  data?: ExportData;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

interface UseExportReturn {
  isExporting: boolean;
  exportSuccess: boolean;
  exportError: string | null;
  handleExport: (format?: ExportFormat) => Promise<void>;
  showExportOptions: () => void;
}

export const useExport = (options: UseExportOptions = {}): UseExportReturn => {
  const { data, onExportComplete, onExportError } = options;
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = useCallback(
    async (format: ExportFormat = 'json') => {
      if (!data) {
        const error = new Error('No data to export');
        onExportError?.(error);
        return;
      }

      setIsExporting(true);
      setExportError(null);
      setExportSuccess(false);

      try {
        await exportData(data, format);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
        onExportComplete?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Export failed';
        setExportError(message);
        onExportError?.(error instanceof Error ? error : new Error(message));
      } finally {
        setIsExporting(false);
      }
    },
    [data, onExportComplete, onExportError]
  );

  const showExportOptions = useCallback(() => {
    Alert.alert(
      'Export Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'CSV', onPress: () => handleExport('csv') },
        { text: 'JSON', onPress: () => handleExport('json') },
      ]
    );
  }, [handleExport]);

  return {
    isExporting,
    exportSuccess,
    exportError,
    handleExport,
    showExportOptions,
  };
};
