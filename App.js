import React, { useState } from "react";
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
  Animated,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

const { width } = Dimensions.get("window");

export default function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [pdfName, setPdfName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const requestPermissions = async () => {
    const { status: imageStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (imageStatus !== "granted") {
      Alert.alert(
        "🔒 Permissions Required",
        "Please grant permissions to access photos.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    try {
      console.log("Requesting permissions...");
      const hasPermission = await requestPermissions();

      if (!hasPermission) {
        console.log("Permissions denied");
        Alert.alert(
          "⚠️ Permissions Needed",
          "Please go to Settings → Apps → PDF-maker → Permissions and enable Storage/Photos access.",
          [{ text: "OK" }]
        );
        return;
      }

      console.log("Permissions granted, opening image picker...");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.7,
        allowsEditing: false,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets) {
        console.log(`Selected ${result.assets.length} images`);
        setSelectedImages([...selectedImages, ...result.assets]);
        Alert.alert("✅ Success", `${result.assets.length} images selected!`);
      } else {
        console.log("User cancelled image picker");
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert(
        "❌ Error",
        `Failed to pick images: ${error.message}\n\nTry restarting the app or check permissions in Settings.`
      );
    }
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    Alert.alert("🗑️ Clear All", "Remove all selected images?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => setSelectedImages([]),
      },
    ]);
  };

  const generatePDF = async () => {
    if (selectedImages.length === 0) {
      Alert.alert("📷 No Images", "Please select at least one image.");
      return;
    }

    if (!pdfName.trim()) {
      Alert.alert("✏️ PDF Name Required", "Please enter a name for your PDF.");
      return;
    }

    setIsGenerating(true);

    try {
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
          Alert.alert(
            "❌ Error",
            `Could not read image ${i + 1}. It may be stored in iCloud. Please download it first.`
          );
          setIsGenerating(false);
          return;
        }
      }

      if (images.length === 0) {
        Alert.alert("❌ Error", "No images could be processed.");
        setIsGenerating(false);
        return;
      }

      console.log(`Creating PDF with ${images.length} images`);

      const imagesHtml = images
        .map(
          (base64, index) =>
            `<img src="data:image/jpeg;base64,${base64}" style="width:100%;display:block;"/>`
        )
        .join("");

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

      console.log("Generating PDF...");

      const { uri } = await Print.printToFileAsync({ html });

      console.log("PDF generated at:", uri);

      await savePDF(uri);
    } catch (error) {
      console.error("PDF generation error:", error);
      Alert.alert("❌ Error", "Failed to generate PDF: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const savePDF = async (uri) => {
    try {
      const fileName = `${pdfName.trim()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;

      // Move/copy the file to a permanent location
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      console.log("PDF saved to:", newUri);

      // Use sharing for both platforms - works everywhere!
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: "application/pdf",
          dialogTitle: "Save PDF",
          UTI: "com.adobe.pdf",
        });

        Alert.alert(
          "✅ Success!",
          `PDF "${fileName}" created! You can now save it to your device.`,
          [
            {
              text: "OK",
              onPress: () => {
                setSelectedImages([]);
                setPdfName("");
              },
            },
          ]
        );
      } else {
        Alert.alert("✅ PDF Created!", `PDF saved as: ${fileName}`, [
          {
            text: "OK",
            onPress: () => {
              setSelectedImages([]);
              setPdfName("");
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("❌ Save Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header with Gradient Effect */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.titleEmoji}>📄</Text>
          <View>
            <Text style={styles.title}>PDF Maker</Text>
            <Text style={styles.subtitle}>Convert images to PDF instantly</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* PDF Name Input Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>✏️</Text>
            <Text style={styles.cardTitle}>PDF Name</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter PDF name (e.g., Documents_2024)"
            value={pdfName}
            onChangeText={setPdfName}
            placeholderTextColor="#999"
            maxLength={50}
          />
          <Text style={styles.charCount}>{pdfName.length}/50</Text>
        </View>

        {/* Images Counter Card */}
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{selectedImages.length}</Text>
              <Text style={styles.statLabel}>Images</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{selectedImages.length}</Text>
              <Text style={styles.statLabel}>Pages</Text>
            </View>
            {selectedImages.length > 0 && (
              <>
                <View style={styles.statDivider} />
                <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
                  <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Image Grid */}
        {selectedImages.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🖼️</Text>
              <Text style={styles.cardTitle}>Selected Images</Text>
            </View>
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
                  <View style={styles.imageBadge}>
                    <Text style={styles.imageBadgeText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>No Images Yet</Text>
            <Text style={styles.emptyText}>
              Tap the button below to select images{"\n"}from your gallery
            </Text>
          </View>
        )}

        {/* Instructions */}
        {selectedImages.length === 0 && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 How to use:</Text>
            <Text style={styles.tipText}>1. Enter a name for your PDF</Text>
            <Text style={styles.tipText}>2. Select images from gallery</Text>
            <Text style={styles.tipText}>3. Arrange or remove images</Text>
            <Text style={styles.tipText}>4. Tap Generate PDF</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.selectButton]}
          onPress={pickImages}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonIcon}>📸</Text>
          <Text style={styles.buttonText}>Select Images</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.generateButton,
            (selectedImages.length === 0 || !pdfName.trim() || isGenerating) &&
              styles.buttonDisabled,
          ]}
          onPress={generatePDF}
          disabled={
            selectedImages.length === 0 || !pdfName.trim() || isGenerating
          }
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}>Creating PDF...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.buttonIcon}>🎯</Text>
              <Text style={styles.buttonText}>Generate PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Made By Credit */}
        <View style={styles.creditContainer}>
          <Text style={styles.creditText}>Made by Nitesh Saxena</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#1e3a8a",
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleEmoji: {
    fontSize: 50,
    marginRight: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e40af",
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },
  clearButton: {
    flex: 1,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginTop: 8,
  },
  imageContainer: {
    width: (width - 64) / 3,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#ef4444",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  imageBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  tipsCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#fbbf24",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#78350f",
    marginBottom: 6,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: "#fff",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  button: {
    flexDirection: "row",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  selectButton: {
    backgroundColor: "#1e40af",
  },
  generateButton: {
    backgroundColor: "#dc2626",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  creditContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  creditText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
});
