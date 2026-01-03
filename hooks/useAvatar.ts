import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface UseAvatarOptions {
  onAvatarUpdate?: (uri: string | null) => void;
}

interface UseAvatarReturn {
  showAvatarModal: boolean;
  setShowAvatarModal: (show: boolean) => void;
  handleAvatarPick: (source: 'camera' | 'gallery') => Promise<void>;
  handleRemoveAvatar: () => void;
  isPickingAvatar: boolean;
}

export const useAvatar = (options: UseAvatarOptions = {}): UseAvatarReturn => {
  const { onAvatarUpdate } = options;
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);

  const handleAvatarPick = useCallback(async (source: 'camera' | 'gallery') => {
    try {
      setIsPickingAvatar(true);
      let result;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to take photos.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permission Required',
            'Photo library permission is required to select photos.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        onAvatarUpdate?.(uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsPickingAvatar(false);
      setShowAvatarModal(false);
    }
  }, [onAvatarUpdate]);

  const handleRemoveAvatar = useCallback(() => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onAvatarUpdate?.(null);
            setShowAvatarModal(false);
          },
        },
      ]
    );
  }, [onAvatarUpdate]);

  return {
    showAvatarModal,
    setShowAvatarModal,
    handleAvatarPick,
    handleRemoveAvatar,
    isPickingAvatar,
  };
};
