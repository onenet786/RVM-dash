// contexts/AuthContext.js
import React, { createContext, useContext, useState } from 'react';
import { getRecycledetails, registerUser } from './profileApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    status: 'idle',
    error: null,
    responseData: null,
    recycleDetails: null,
  });

  const register = async (userData) => {
    setAuthState(prev => ({ ...prev, status: 'loading', error: null }));
    
    try {
      // 1. First make the registration call
      const registrationResult = await registerUser(userData);
      
      // 2. If registration is successful, fetch recycle details
      if (registrationResult.success) {
        const recycleResponse = await getRecycledetails(userData.phoneNumber);
        
        // Handle response based on backend structure
        if (recycleResponse.success) {
          setAuthState(prev => ({
            ...prev,
            recycleDetails: recycleResponse.data,
            status: 'success',
          }));
          return recycleResponse.data;
        } else {
          // Recycle details not found (success: false case)
          setAuthState(prev => ({
            ...prev,
            recycleDetails: null,
            status: 'success',
          }));
          return false;
        }
      }
      
      throw new Error(registrationResult.message || 'Registration failed');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);