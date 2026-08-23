import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function QrCode() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Scan QR</Text>
      

      <ImageBackground
        source={require('../assets/images/scan_bg.jpeg')} // Using the QR image as background
        style={styles.compressedBackground}
        imageStyle={styles.backgroundImageStyle}
      >
       
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    alignItems: 'center',
  },
  header: {
    fontSize: 25,
    fontWeight: '500',
    marginBottom: 20,
    color: '#333',
  },
  compressedBackground: {
    width: width * 0.9,
    height: height * 0.6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  backgroundImageStyle: {
    borderRadius: 20,
  },
  scanButton: {
    height: 50,
    width: width * 0.5,
    marginTop: 20,
    borderColor: '#5ba9e0',
    borderWidth: 1,
    borderRadius: 30,
    paddingVertical: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#5ba9e0',
    fontSize: 22,
    fontWeight: '500',
  },
});