import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction, SavingsGoal, Bill, User, UserPreferences } from '../types';

export type ExportFormat = 'csv' | 'json';

export interface ExportData {
  transactions: Transaction[];
  goals: SavingsGoal[];
  bills: Bill[];
  user: User;
  preferences: UserPreferences;
}

/**
 * Convert transactions to CSV format
 */
const transactionsToCSV = (transactions: Transaction[]): string => {
  const headers = ['ID', 'Date', 'Merchant', 'Category', 'Type', 'Amount', 'Status'];
  const rows = transactions.map(t => [
    t.id,
    new Date(t.date).toISOString(),
    `"${t.merchantName.replace(/"/g, '""')}"`, // Escape quotes in merchant name
    t.category,
    t.type,
    t.amount.toFixed(2),
    t.status || 'completed',
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

/**
 * Convert bills to CSV format
 */
const billsToCSV = (bills: Bill[]): string => {
  const headers = ['ID', 'Name', 'Amount', 'Due Date', 'Status', 'Is Paid'];
  const rows = bills.map(b => [
    b.id,
    `"${b.name.replace(/"/g, '""')}"`,
    b.amount.toFixed(2),
    new Date(b.dueDate).toISOString(),
    b.status,
    b.isPaid ? 'Yes' : 'No',
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

/**
 * Convert savings goals to CSV format
 */
const goalsToCSV = (goals: SavingsGoal[]): string => {
  const headers = ['ID', 'Name', 'Target Amount', 'Current Amount', 'Progress %', 'Icon', 'Color'];
  const rows = goals.map(g => [
    g.id,
    `"${g.name.replace(/"/g, '""')}"`,
    g.targetAmount.toFixed(2),
    g.currentAmount.toFixed(2),
    ((g.currentAmount / g.targetAmount) * 100).toFixed(1),
    g.icon,
    g.color,
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

/**
 * Export all app data as CSV (multiple files zipped or combined)
 */
export const exportAsCSV = async (data: ExportData): Promise<string> => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Create a combined CSV with sections
  const sections = [
    '# TRANSACTIONS',
    transactionsToCSV(data.transactions),
    '',
    '# BILLS',
    billsToCSV(data.bills),
    '',
    '# SAVINGS GOALS',
    goalsToCSV(data.goals),
  ];
  
  const csvContent = sections.join('\n');
  const fileName = `foresight_export_${timestamp}.csv`;
  const file = new File(Paths.cache, fileName);
  
  file.write(csvContent);
  
  return file.uri;
};

/**
 * Export all app data as JSON
 */
export const exportAsJSON = async (data: ExportData): Promise<string> => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data: {
      transactions: data.transactions,
      bills: data.bills,
      goals: data.goals,
      user: {
        name: data.user.name,
        memberSince: data.user.memberSince,
        // Omit sensitive financial data from user object if needed
      },
      preferences: data.preferences,
    },
  };
  
  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const fileName = `foresight_export_${timestamp}.json`;
  const file = new File(Paths.cache, fileName);
  
  file.write(jsonContent);
  
  return file.uri;
};

/**
 * Share the exported file using native share sheet
 */
export const shareExportedFile = async (fileUri: string): Promise<void> => {
  const isAvailable = await Sharing.isAvailableAsync();
  
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }
  
  await Sharing.shareAsync(fileUri, {
    mimeType: fileUri.endsWith('.json') ? 'application/json' : 'text/csv',
    dialogTitle: 'Export Foresight Data',
  });
};

/**
 * Main export function - exports data and opens share sheet
 */
export const exportData = async (
  data: ExportData,
  format: ExportFormat = 'json'
): Promise<void> => {
  const fileUri = format === 'csv'
    ? await exportAsCSV(data)
    : await exportAsJSON(data);
  
  await shareExportedFile(fileUri);
  
  // Clean up the file after sharing
  try {
    const file = new File(fileUri);
    file.delete();
  } catch {
    // Ignore cleanup errors
  }
};
