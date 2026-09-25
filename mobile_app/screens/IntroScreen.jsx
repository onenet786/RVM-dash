import { View, Image, StyleSheet, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import React, { useEffect } from 'react';
import startScreen from "../assets/images/startscreen.png";
import { useNavigation } from '@react-navigation/native';

const IntroScreen = () => {
  const navigation = useNavigation();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Login');
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.9} 
      onPress={() => navigation.navigate('Login')}
    >
      <StatusBar hidden />
      <Image 
        source={startScreen} 
        style={styles.image} 
        resizeMode="contain"
      />
    </TouchableOpacity>
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