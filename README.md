# 📄 PDF Maker App

A beautiful and intuitive React Native Expo app that converts images from your gallery into PDF documents with a custom name.

## ✨ Features

- 📸 **Select Multiple Images**: Pick multiple images from your photo gallery
- 🎯 **Custom PDF Names**: Name your PDF files as you wish
- 🗂️ **Image Management**: Preview selected images and remove unwanted ones
- 📱 **Cross-Platform**: Works on both iOS and Android
- 💾 **Easy Download**: Automatically saves to Downloads (Android) or share (iOS)
- 🎨 **Modern UI**: Clean and user-friendly interface

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

The dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Running the App

1. **Start the development server:**
   ```bash
   npx expo start
   ```

2. **Run on your device:**
   - Scan the QR code with Expo Go app (Android) or Camera app (iOS)
   
3. **Run on emulator/simulator:**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS (Mac only)
   ```

## 📱 How to Use

1. **Enter PDF Name**: Type the desired name for your PDF in the text input field
2. **Select Images**: Tap the "📸 Select Images" button to choose photos from your gallery
3. **Review Selection**: View your selected images in a grid layout
4. **Remove Images** (optional): Tap the ✕ button on any image to remove it
5. **Generate PDF**: Once satisfied, tap "🎯 Generate PDF"
6. **Save/Share**: 
   - On **Android**: The PDF will be saved to your Downloads folder
   - On **iOS**: A share dialog will appear to save or share the PDF

## 🔧 Technologies Used

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform
- **expo-image-picker**: For selecting images from gallery
- **expo-print**: For generating PDF files
- **expo-file-system**: For file operations
- **expo-sharing**: For sharing files (iOS)
- **expo-media-library**: For saving to device storage

## 📝 Permissions

The app requires the following permissions:

### iOS
- Photo Library Access: To select images
- Camera Access: For future camera features

### Android
- Read External Storage: To access photos
- Write External Storage: To save PDFs
- Read Media Images: For Android 13+

## 🎨 Features in Detail

### Image Selection
- Select multiple images at once
- Images are displayed in a grid layout
- Each image shows its order number
- Easy removal of unwanted images

### PDF Generation
- Converts all selected images into a single PDF
- Each image appears on its own page
- Images are scaled to fit the page while maintaining aspect ratio
- High-quality output

### File Management
- Custom naming for each PDF
- Automatic file saving
- Platform-specific save locations
- User-friendly success messages

## 🐛 Troubleshooting

### "Permissions Required" Alert
- Make sure to grant all requested permissions
- On iOS: Go to Settings > Privacy > Photos
- On Android: Go to Settings > Apps > PDF Maker > Permissions

### Images Not Loading
- Check that you've granted photo library permissions
- Try selecting images again
- Restart the app if issues persist

### PDF Not Saving
- Ensure storage permissions are granted
- Check if you have sufficient storage space
- On Android, look in the Downloads folder
- On iOS, complete the share dialog

## 📄 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

Made with ❤️ using Expo and React Native

