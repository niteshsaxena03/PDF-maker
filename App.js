import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [pdfName, setPdfName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const requestPermissions = async () => {
    const { status: imageStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    
    if (imageStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Please grant permissions to access photos and save files.');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.6,
      });

      if (!result.canceled && result.assets) {
        console.log(`Selected ${result.assets.length} images`);
        setSelectedImages([...selectedImages, ...result.assets]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images: ' + error.message);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select at least one image.');
      return;
    }

    if (!pdfName.trim()) {
      Alert.alert('PDF Name Required', 'Please enter a name for your PDF.');
      return;
    }

    setIsGenerating(true);

    try {
      // Read images and convert to base64
      const images = [];
      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        console.log(`Processing image ${i + 1}: ${img.uri}`);
        
        try {
          const base64 = await FileSystem.readAsStringAsync(img.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          if (base64 && base64.length > 0) {
            images.push(base64);
            console.log(`Image ${i + 1} converted, size: ${base64.length}`);
          } else {
            console.error(`Image ${i + 1} returned empty base64`);
          }
        } catch (err) {
          console.error(`Failed to read image ${i + 1}:`, err.message);
          Alert.alert('Error', `Could not read image ${i + 1}. It may be stored in iCloud. Please download it first.`);
          setIsGenerating(false);
          return;
        }
      }

      if (images.length === 0) {
        Alert.alert('Error', 'No images could be processed.');
        setIsGenerating(false);
        return;
      }

      console.log(`Creating PDF with ${images.length} images`);

      // Create HTML with images flowing continuously without page breaks
      const imagesHtml = images.map((base64, index) => 
        `<img src="data:image/jpeg;base64,${base64}" style="width:100%;display:block;"/>`
      ).join('');

      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    img { width: 100%; display: block; }
  </style>
</head>
<body>${imagesHtml}</body>
</html>`;

      console.log('Generating PDF...');
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });

      console.log('PDF generated at:', uri);

      // Save based on platform
      await savePDF(uri);

    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const savePDF = async (uri) => {
    try {
      const fileName = `${pdfName.trim()}.pdf`;
      
      if (Platform.OS === 'android') {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (permission.granted) {
          const asset = await MediaLibrary.createAssetAsync(uri);
          await MediaLibrary.createAlbumAsync('Download', asset, false);
          Alert.alert('Success!', `PDF saved to Downloads: ${fileName}`, [
            { text: 'OK', onPress: () => { setSelectedImages([]); setPdfName(''); } }
          ]);
        }
      } else {
        const newUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.moveAsync({ from: uri, to: newUri });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(newUri);
          setSelectedImages([]);
          setPdfName('');
        }
      }
    } catch (error) {
      Alert.alert('Save Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>📄 PDF Maker</Text>
        <Text style={styles.subtitle}>Convert images to PDF</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>PDF Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter PDF name"
            value={pdfName}
            onChangeText={setPdfName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.imageCountContainer}>
          <Text style={styles.imageCount}>
            {selectedImages.length} {selectedImages.length === 1 ? 'image' : 'images'} selected
          </Text>
        </View>

        {selectedImages.length > 0 && (
          <View style={styles.imageGrid}>
            {selectedImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.imageNumber}>{index + 1}</Text>
              </View>
            ))}
          </View>
        )}

        {selectedImages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🖼️</Text>
            <Text style={styles.emptyStateText}>No images selected</Text>
            <Text style={styles.emptyStateSubtext}>Tap the button below to select images</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.selectButton]}
          onPress={pickImages}
          disabled={isGenerating}
        >
          <Text style={styles.buttonText}>📸 Select Images</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.generateButton,
            (selectedImages.length === 0 || !pdfName.trim() || isGenerating) && styles.buttonDisabled,
          ]}
          onPress={generatePDF}
          disabled={selectedImages.length === 0 || !pdfName.trim() || isGenerating}
        >
          {isGenerating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>Generating...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>🎯 Generate PDF</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  imageCountContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  imageCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  imageContainer: {
    width: '31.33%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageNumber: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButton: {
    backgroundColor: '#007AFF',
  },
  generateButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
