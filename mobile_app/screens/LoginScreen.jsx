import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ImageBackground, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

export default function LoginScreen({ navigation }) {
  const [phoneNo, setPhoneNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Format mobile number (limit to 11 digits)
  const handlePhoneChange = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 11 digits
    if (cleaned.length <= 11) {
      setPhoneNo(cleaned);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    // Input validation
    if (!phoneNo.trim() || phoneNo.length !== 11 || !/^03\d{9}$/.test(phoneNo)) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number starting with 03');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        mobileOrEmail: phoneNo,
        password: password
      });

      if (response.data.success) {
        // Store login state and user data in AsyncStorage
        await AsyncStorage.multiSet([
          ['isLoggedIn', 'true'],
          ['user', JSON.stringify(response.data.user)],
          ['token', response.data.token || '']
        ]);

        // Navigate to Dashboard with user data
        navigation.navigate('Dashboard', {
          screen: 'Dashboard',
          params: {
            user: response.data.user,
            hasRecycleHistory: response.data.recycleDetails 
          }
        });
      } else {
        Alert.alert('Error', response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid phone number or password';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgetPassword');
  };

  return (
    <ImageBackground
      source={require('../assets/images/loginbg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <TextInput
            style={styles.input}
            placeholder="Phone Number (03471234567)"
            placeholderTextColor="#fff"
            value={phoneNo}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={11}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#fff"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={toggleShowPassword}
            >
              <Icon 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>

          {/* Improved Forgot Password Section */}
          <View style={styles.forgetPasswordContainer}>
            <TouchableOpacity 
              style={styles.forgetPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgetPasswordText}>Forgot Password?</Text>
              <Icon 
                name="chevron-forward" 
                size={16} 
                color="#5e6ac8" 
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.navigate('SignUp')}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '80%',
    padding: 12,
    marginVertical: 10,
    borderRadius: 20,
    backgroundColor: '#67B7D1',
    color: '#fff',
    fontSize: 16,
  },
  forgetPasswordContainer: {
    width: '80%',
    alignItems: 'flex-end',
    marginVertical: 10,
  },
  forgetPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#67B7D1',
  },
  forgetPasswordText: {
    color: '#67B7D1',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  arrowIcon: {
    marginLeft: 2,
  },
  passwordContainer: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#67B7D1',
    borderRadius: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  textContainer: {
    marginTop: 50,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 70,
  },
  button: {
    backgroundColor: '#67B7D1',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
    marginHorizontal: 5,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});