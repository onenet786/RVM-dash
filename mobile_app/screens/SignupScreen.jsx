import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme
} from 'react-native';
import { useAuth } from '../contextApi/auth';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [nic, setNic] = useState('');
  const [gender, setGender] = useState('male');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
const colorScheme = useColorScheme();
const isDarkMode = colorScheme === 'dark';
const placeholderColor = isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  // Get the appropriate avatar based on gender
  const getAvatarImage = () => {
    switch(gender) {
      case 'male':
        return require('../assets/images/male-avatar.png');
      case 'female':
        return require('../assets/images/female-avatar.png');
      default:
        return require('../assets/images/neutral-avatar.png');
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // Format NIC input (add dashes automatically)
  const handleNicChange = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format based on length
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
    }
    if (cleaned.length > 12) {
      formatted = `${formatted.substring(0, 13)}-${formatted.substring(13)}`;
    }
    
    // Limit to 15 characters (5 + 7 + 1 + 2 dashes)
    if (cleaned.length <= 13) {
      setNic(formatted);
    }
  };

  // Format mobile number (limit to 11 digits)
  const handleMobileChange = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 11 digits
    if (cleaned.length <= 11) {
      setMobile(cleaned);
    }
  };

  const handleSubmit = async () => {
    // Input validation
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    
    if (!mobile.trim() || mobile.length !== 11 || !/^03\d{9}$/.test(mobile)) {
      Alert.alert('Error', 'Please enter a valid 11-digit mobile number starting with 03');
      return;
    }
    
    // NIC validation (13 digits with or without dashes)
    const cleanedNic = nic.replace(/\D/g, '');
    if (!nic.trim() || cleanedNic.length !== 13 || !/^\d{5}-\d{7}-\d{1}$/.test(nic)) {
      Alert.alert('Error', 'Please enter a valid CNIC in the format 42401-2285792-9');
      return;
    }
    
    if (!age || isNaN(age) || age < 13 || age > 120) {
      Alert.alert('Error', 'Please enter a valid age between 13 and 120');
      return;
    }
    
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    if (!password.trim() || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare user data for registration
      const userData = {
        username,
        mobile,
        nic: cleanedNic, // Store without dashes
        age: parseInt(age),
        gender,
        email,
        password,
        profilePic: gender
      };

      // Call register function from auth context
      const recycleDetails = await register(userData);
      
      // Registration was successful
      if (recycleDetails) {
        Alert.alert('Success', 'Registration completed successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.navigate('Login')
            }
          }
        ]);
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'This mobile number or email is already registered';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.profilePicContainer}>
              <Image 
                source={getAvatarImage()} 
                style={styles.profilePic} 
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#fff"
              value={username}
              onChangeText={setUsername}
            />

            <TextInput
              style={styles.input}
              placeholder="CNIC (42402-2245522-2)"
              placeholderTextColor="#fff"
              value={nic}
              onChangeText={handleNicChange}
              keyboardType="numeric"
              maxLength={15} // 5 + 7 + 1 + 2 dashes
            />

            <TextInput
              style={styles.input}
              placeholder="03001234567"
              placeholderTextColor="#fff"
              value={mobile}
              onChangeText={handleMobileChange}
              keyboardType="phone-pad"
              maxLength={11}
            />

            <TextInput
              style={styles.input}
              placeholder="Age"
              placeholderTextColor="#fff"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gender}
                style={styles.picker}
                dropdownIconColor="#fff"
                onValueChange={(value) => setGender(value)}
              >
                <Picker.Item label="Male" value="male" color={placeholderColor} />
                <Picker.Item label="Female" value="female" color={placeholderColor} />
                <Picker.Item label="Prefer not to say" value="other" color={placeholderColor} />
              </Picker>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#fff"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#fff"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Re-type Password"
                placeholderTextColor="#fff"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={toggleShowConfirmPassword}
              >
                <Icon 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={24} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Complete Registration</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 20,
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
  profilePicContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  profilePic: {
    width: 130,
    height: 130,
    borderRadius: 70,
  },
  pickerContainer: {
    width: '80%',
    backgroundColor: '#67B7D1',
    borderRadius: 20,
    marginVertical: 10,
  },
  picker: {
    height: 55,
    color: '#fff',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#67B7D1',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SignUpScreen;