
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform } from 'react-native';

export async function shareStatsAsImage(viewRef: any): Promise<void> {
  try {
    console.log('Starting image capture...');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
    });
    
    console.log('Image captured:', uri);

    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      Alert.alert('Error', 'Sharing is not available on this device');
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Your Tree Planting Stats',
    });
    
    console.log('Image shared successfully');
  } catch (error) {
    console.error('Error sharing stats image:', error);
    Alert.alert('Error', 'Failed to share stats. Please try again.');
  }
}
