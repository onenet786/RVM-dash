import { View, Text, StyleSheet, Animated, Easing, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const Promotions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webViewUrl, setWebViewUrl] = useState(null);
  
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true; // To prevent memory leaks

    const fetchUserAndGenerateLink = async () => {
      try {
        // 1. Get user data from local storage
        const userData = await AsyncStorage.getItem('user');
        console.log('User Data:', userData);
        if (!userData) {
          throw new Error('User data not found. Please login again.');
        }

        const parsedUserData = JSON.parse(userData);
        console.log('Parsed User Data:', parsedUserData);
        // if (!parsedUserData?.user) {
        //   throw new Error('Invalid user data format');
        // }

        const { username, mobile } = parsedUserData;
        if (!username || !mobile) {
          throw new Error('Username or mobile number missing');
        }

        // 2. Call API to generate Vouch365 link
        const response = await axios.post(`${API_BASE_URL}/generate-vouch365-link`, {
          username,
          phone: mobile
        }, {
          timeout: 10000 // 10 second timeout
        });

        if (!response.data?.success || !response.data?.link) {
          throw new Error(response.data?.message || 'Invalid response from server');
        }

        if (isMounted) {
          setWebViewUrl(response.data.link);
        }
      } catch (err) {
        console.error('Promotions Error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load promotions. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUserAndGenerateLink();

    // Animation setup
    const animation = Animated.loop(
      Animated.timing(
        spinValue,
        {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true
        }
      )
    );
    animation.start();

    return () => {
      isMounted = false;
      animation.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  if (error) {
    return (
      <View style={styles.container}>
        <Image 
          source={require('../assets/images/error.png')} // Add an error image
          style={styles.errorImage}
        />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.subtitle}>Please try again later</Text>
      </View>
    );
  }

  if (!webViewUrl) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.circle, { transform: [{ rotate: spin }] }]}>
          <Image 
            source={require('../assets/images/loading.png')}
            style={styles.image}
          />
        </Animated.View>
        <Text style={styles.title}>Loading Promotions...</Text>
        <Text style={styles.subtitle}>Preparing your exclusive offers</Text>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <WebView
        source={{ uri: webViewUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196f3" />
          </View>
        )}
        onError={(syntheticEvent) => {
          console.error('WebView Error:', syntheticEvent.nativeEvent);
          setError('Failed to load promotion content. The link might be invalid.');
        }}
        onHttpError={(syntheticEvent) => {
          console.error('HTTP Error:', syntheticEvent.nativeEvent);
          setError('The promotion content is currently unavailable.');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
   
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  webview: {
    flex: 1,

  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#bbdefb',
  },
  image: {
    width: 80,
    height: 80,
    tintColor: '#2196f3',
  },
  errorImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  noContentImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
});

export default Promotions;