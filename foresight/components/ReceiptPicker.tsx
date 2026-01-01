import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert,
  Modal,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Paths, File, Directory } from 'expo-file-system';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, typography } from '../theme';

interface Props {
  receiptUri?: string;
  onReceiptChange: (uri: string | undefined) => void;
  transactionId?: string; // Used for file naming when saving receipt
}

// Create receipts directory reference
const getReceiptsDir = () => new Directory(Paths.document, 'receipts');

const ReceiptPicker: React.FC<Props> = ({ receiptUri, onReceiptChange, transactionId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Ensure receipts directory exists
  const ensureReceiptsDir = async () => {
    const receiptsDir = getReceiptsDir();
    if (!receiptsDir.exists) {
      receiptsDir.create();
    }
  };

  // Copy picked image to app storage
  const saveReceipt = async (sourceUri: string): Promise<string> => {
    await ensureReceiptsDir();
    const filename = `receipt_${transactionId || Date.now()}_${Math.random().toString(36).substr(2, 6)}.jpg`;
    const sourceFile = new File(sourceUri);
    const destFile = new File(getReceiptsDir(), filename);
    sourceFile.copy(destFile);
    return destFile.uri;
  };

  // Request camera permissions
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to take receipt photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Request media library permissions
  const requestMediaPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please allow photo library access to select receipt images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    if (!(await requestCameraPermission())) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7, // Compress to save storage
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const savedUri = await saveReceipt(result.assets[0].uri);
        onReceiptChange(savedUri);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    if (!(await requestMediaPermission())) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const savedUri = await saveReceipt(result.assets[0].uri);
        onReceiptChange(savedUri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveReceipt = async () => {
    Alert.alert(
      'Remove Receipt',
      'Are you sure you want to remove this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Delete file from storage if it's in our receipts directory
            if (receiptUri?.includes('/receipts/')) {
              try {
                const fileToDelete = new File(receiptUri);
                if (fileToDelete.exists) {
                  fileToDelete.delete();
                }
              } catch (error) {
                console.warn('Failed to delete receipt file:', error);
              }
            }
            onReceiptChange(undefined);
          },
        },
      ]
    );
  };

  const showActionSheet = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Add Receipt',
      'Choose how to add a receipt',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handleChooseFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.mint} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      </View>
    );
  }

  if (receiptUri) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.previewContainer}
          onPress={() => setPreviewVisible(true)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: receiptUri }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <Ionicons name="expand-outline" size={20} color={colors.white} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={handleRemoveReceipt}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>

        {/* Full screen preview modal */}
        <Modal
          visible={previewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}
        >
          <TouchableOpacity 
            style={styles.fullScreenBackdrop}
            onPress={() => setPreviewVisible(false)}
            activeOpacity={1}
          >
            <Image 
              source={{ uri: receiptUri }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.closeFullScreenBtn}
              onPress={() => setPreviewVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={showActionSheet}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="receipt-outline" size={24} color={colors.neutral400} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.addButtonTitle}>Add Receipt</Text>
          <Text style={styles.addButtonSubtitle}>Take a photo or choose from library</Text>
        </View>
        <Ionicons name="add-circle-outline" size={24} color={colors.mint} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[2],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  addButtonTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
    marginBottom: 2,
  },
  addButtonSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral500,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.xl,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: borderRadius.md,
    padding: spacing[2],
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
    padding: spacing[2],
  },
  removeBtnText: {
    fontSize: typography.fontSizes.sm,
    color: colors.danger,
    fontWeight: typography.fontWeights.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface100,
    borderWidth: 1,
    borderColor: colors.surface300,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.fontSizes.sm,
    color: colors.neutral400,
  },
  fullScreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeFullScreenBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ReceiptPicker;
