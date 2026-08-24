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

const PRESET_AVATARS = [
  { id: 'male', label: 'Male', icon: 'account', color: '#0284C7' },
  { id: 'female', label: 'Female', icon: 'account-heart', color: '#EC4899' },
  { id: 'leaf', label: 'Eco Champion', icon: 'leaf', color: '#10B981' },
  { id: 'earth', label: 'Earth Guardian', icon: 'earth', color: '#0EA5E9' },
  { id: 'recycle', label: 'Super Recycler', icon: 'recycle-variant', color: '#059669' },
  { id: 'star', label: 'Eco Star', icon: 'star-shooting', color: '#EAB308' },
];

const SignUpScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('male');
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

  // Get the appropriate avatar based on selection or gender
  const getAvatarImage = () => {
    switch(selectedAvatar || gender) {
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

  // Format DOB input (YYYY-MM-DD)
  const handleDobChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = `${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
    }
    if (cleaned.length > 6) {
      formatted = `${formatted.substring(0, 7)}-${formatted.substring(7)}`;
    }
    if (cleaned.length <= 8) {
      setDob(formatted);
      if (cleaned.length === 8) {
        // Auto compute age
        const yr = parseInt(cleaned.substring(0, 4));
        const currentYear = new Date().getFullYear();
        if (yr > 1920 && yr <= currentYear) {
          setAge(String(currentYear - yr));
        }
      }
    }
  };

  // Format NIC input (add dashes automatically)
  const handleNicChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
    }
    if (cleaned.length > 12) {
      formatted = `${formatted.substring(0, 13)}-${formatted.substring(13)}`;
    }
    if (cleaned.length <= 13) {
      setNic(formatted);
    }
  };

  // Format mobile number (limit to 11 digits)
  const handleMobileChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setMobile(cleaned);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your Full Name');
      return;
    }

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

    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert('Error', 'Please enter a valid Date of Birth (YYYY-MM-DD)');
      return;
    }
    
    const computedAge = age ? parseInt(age) : 20;
    if (isNaN(computedAge) || computedAge < 10 || computedAge > 120) {
      Alert.alert('Error', 'Please enter a valid age between 10 and 120');
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
      const userData = {
        fullName: fullName.trim(),
        username: username.trim(),
        mobile: mobile.trim(),
        nic: cleanedNic,
        age: computedAge,
        dob: dob.trim(),
        profileImage: selectedAvatar,
        gender,
        email: email.trim().toLowerCase(),
        password,
        profilePic: selectedAvatar
      };

      const recycleDetails = await register(userData);
      
      Alert.alert('Success', 'Registration completed successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            navigation.navigate('Login');
          }
        }
      ]);
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'This mobile number, username, or email is already registered';
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

            {/* Avatar Selector Gallery */}
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
              Choose Your Eco Profile Avatar (Optional)
            </Text>
            <View style={styles.avatarRow}>
              {PRESET_AVATARS.map((av) => (
                <TouchableOpacity
                  key={av.id}
                  style={[
                    styles.avatarBadge,
                    selectedAvatar === av.id && styles.avatarBadgeSelected
                  ]}
                  onPress={() => setSelectedAvatar(av.id)}
                >
                  <Icon name={av.id === 'male' ? 'man' : av.id === 'female' ? 'woman' : 'leaf'} size={18} color={selectedAvatar === av.id ? '#10B981' : '#fff'} />
                  <Text style={[styles.avatarBadgeText, selectedAvatar === av.id && { color: '#10B981', fontWeight: 'bold' }]}>
                    {av.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Full Name (e.g. Ali Ahmed)"
              placeholderTextColor="#fff"
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#fff"
              value={username}
              onChangeText={setUsername}
            />

            <TextInput
              style={styles.input}
              placeholder="Date of Birth (YYYY-MM-DD)"
              placeholderTextColor="#fff"
              value={dob}
              onChangeText={handleDobChange}
              keyboardType="numeric"
              maxLength={10}
            />

            <TextInput
              style={styles.input}
              placeholder="CNIC (42402-2245522-2)"
              placeholderTextColor="#fff"
              value={nic}
              onChangeText={handleNicChange}
              keyboardType="numeric"
              maxLength={15}
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
                onValueChange={(value) => {
                  setGender(value);
                  if (value === 'female' && selectedAvatar === 'male') setSelectedAvatar('female');
                  if (value === 'male' && selectedAvatar === 'female') setSelectedAvatar('male');
                }}
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
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    width: '88%',
    marginBottom: 12,
  },
  avatarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 4,
  },
  avatarBadgeSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  avatarBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    width: '80%',
    padding: 12,
    marginVertical: 8,
    borderRadius: 20,
    backgroundColor: '#67B7D1',
    color: '#fff',
    fontSize: 15,
  },
  passwordContainer: {
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: '#67B7D1',
    borderRadius: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#fff',
    fontSize: 15,
  },
  eyeIcon: {
    padding: 10,
  },
  profilePicContainer: {
    alignSelf: 'center',
    marginBottom: 14,
  },
  profilePic: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pickerContainer: {
    width: '80%',
    backgroundColor: '#67B7D1',
    borderRadius: 20,
    marginVertical: 8,
  },
  picker: {
    height: 50,
    color: '#fff',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 22,
    marginTop: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SignUpScreen;