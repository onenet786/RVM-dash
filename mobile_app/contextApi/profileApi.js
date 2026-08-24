import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create a configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL, // Use baseURL instead of repeating it
  timeout: 10000, // Set a reasonable timeout (10 seconds)
});



export const registerUser = async (userData) => {
  try {
    const requestData = {
      username: userData.username,
      fullName: userData.fullName || userData.username,
      mobile: userData.mobile,
      age: userData.age,
      dob: userData.dob,
      profileImage: userData.profileImage,
      nic: userData.nic,
      email: userData.email,
      password: userData.password,
      gender: userData.gender || 'male' // Default to male if not specified
    };

    const response = await api.post('/register', requestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: true,
      data: response.data,
      status: response.status
    };

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.response) {
      // Handle server response errors
      const status = error.response.status;
      let message = error.response.data?.message || 'Registration failed';
      
      if (status === 409) message = 'User already exists';
      if (status === 400) message = error.response.data?.message || 'Invalid data';

      throw {
        message,
        status,
        isNetworkError: false,
        serverError: true,
        responseData: error.response.data
      };
    } else if (error.code === 'ECONNABORTED') {
      throw {
        message: 'Request timeout. Please check your connection.',
        isNetworkError: true,
        isTimeout: true
      };
    } else {
      throw {
        message: 'Network error. Please check your internet connection.',
        isNetworkError: true
      };
    }
  }
};









  export const getRecycledetails = async (phoneNumber) => {
    try {
      const response = await api.get(`/getrecycle/${encodeURIComponent(phoneNumber)}`);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      
      if (!error.response) {
        throw {
          message: 'Network error. Please check your connection.',
          isNetworkError: true
        };
      }
      
      throw {
        message: error.response.data?.error || 'Failed to fetch user',
        status: error.response.status,
        responseData: error.response.data
      };
    }
  };