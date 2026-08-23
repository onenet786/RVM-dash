import { View, Image, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import React, { useEffect } from 'react';
import startScreen from "../assets/images/startscreen.png";
import { useNavigation } from '@react-navigation/native';

const IntroScreen = () => {
  const navigation = useNavigation();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Login'); // Replace 'Login' with your actual login screen name
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Status bar hidden on the splash screen */}
      <StatusBar hidden />
      <Image 
        source={startScreen} 
        style={styles.image} 
        resizeMode="contain" // Changed from "cover" to "contain"
      />
    </View>
  );
};

export default IntroScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  image: {
    height:"100%",
    width: Dimensions.get('window').width,
  },
});