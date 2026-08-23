// VerifyOTP.jsx
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ImageBackground,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ToastAndroid,
  Animated,
  Vibration
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export default function VerifyOTP({ navigation, route }) {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingResend, setIsLoadingResend] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animation functions
  const startAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimation = () => {
    rotateAnim.stopAnimation();
    rotateAnim.setValue(0);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Resend OTP function
  const handleResendOtp = async () => {
    if (countdown > 0 || isLoadingResend) return;

    setIsLoadingResend(true);
    startAnimation();

    try {
      const response = await axios.post(`${API_BASE_URL}/resend-otp`, {
        email: email,
      });

      const data = response.data;

      if (response.status === 200 || data.success) {
        // Show notification
        showNotification();
        
        // Vibrate for feedback
        Vibration.vibrate(100);
        
        // Start countdown
        setCountdown(30);
        startCountdown();
        
        ToastAndroid.show('OTP has been resent to your email', ToastAndroid.LONG);
      } else {
        Alert.alert('Error', data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoadingResend(false);
      stopAnimation();
    }
  };

  // Countdown timer
  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Show notification
  const showNotification = () => {
    console.log('Notification: OTP has been resent to', email);
    // You can add actual push notification here
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/reset-password`, {
        email: email,
        otp: otp,
        newPassword: newPassword
      });
      console.log('Reset password response:', response.data);
      if (response.data.success) {
        ToastAndroid.show('Password reset successfully', ToastAndroid.LONG);
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/loginbg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
           <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 4-digit OTP sent to {email}
            </Text>
        </View>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
           

            {/* OTP Input */}
            <View style={styles.inputContainer}>
              <Icon name="key-outline" size={20} color="#fff" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text
                disabled={countdown > 0 || isLoadingResend}
                style={styles.resendTouchable}
              >
                <Animated.View style={[
                  styles.animatedIcon,
                  { transform: [{ rotate: rotateInterpolate }] }
                ]}>
                  <Icon 
                    name="refresh-outline" 
                    size={20} 
                    color={countdown > 0 || isLoadingResend ? "rgba(255, 255, 255, 0.5)" : "#fff"} 
                  />
                </Animated.View>
              </Text>
            </View>

            {/* Resend Text Option */}
            <TouchableOpacity 
              onPress={handleResendOtp}
              disabled={countdown > 0 || isLoadingResend}
              style={styles.resendTextContainer}
            >
              <Text style={[
                styles.resendText,
                (countdown > 0 || isLoadingResend) && styles.resendTextDisabled
              ]}>
                {isLoadingResend ? 'Sending OTP...' : 
                 countdown > 0 ? `Resend OTP in ${countdown}s` : 
                 "Didn't receive OTP? Resend"}
              </Text>
            </TouchableOpacity>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={20} color="#fff" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={20} color="#fff" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabledButton]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { 
    flex: 1 
  },
  container: { 
    flex: 1 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center',
    paddingBottom: 50 
  },
  content: { 
    padding: 24, 
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#67B7D1',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    fontWeight: "bold"
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#67B7D1',
    borderRadius: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  resendTouchable: {
    padding: 5,
    marginLeft: 5,
  },
  animatedIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    padding: 5,
  },
  countdownText: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
    fontWeight: '500',
  },
  resendTextContainer: {
    marginBottom: 20,
  },
  resendText: {
    color: '#67B7D1',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendTextDisabled: {
    color: 'rgba(103, 183, 209, 0.5)',
  },
  resetButton: {
    width: '100%',
    backgroundColor: '#67B7D1',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: '#67B7D1',
    fontSize: 16,
    fontWeight: '500',
  },
});