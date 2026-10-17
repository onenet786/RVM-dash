// Central JWT holder for the mobile app.
// The backend returns a JWT in the `token` field of successful login / verify
// responses and expects `Authorization: Bearer <token>` on user-scoped endpoints.
// Keep the token in memory (for request interceptors), on axios.defaults (for
// callers that use the global axios import) and in AsyncStorage (across restarts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const AUTH_TOKEN_STORAGE_KEY = '@auth_token';
// Sessions created before '@auth_token' existed persisted the JWT under 'token'
// (see completeSessionLogin in screens/LoginScreen.jsx). Read it as a fallback so
// already-logged-in users are authenticated after upgrading without re-login.
const LEGACY_TOKEN_STORAGE_KEY = 'token';

let inMemoryToken = null;

const applyAxiosDefault = (token) => {
  if (token) {
    axios.defaults.headers.common.Authorization = 'Bearer ' + token;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

// Synchronous getter for request interceptors / fetch callers.
export const getAuthToken = () => inMemoryToken;

// Convenience for raw fetch() calls: spread into a headers object.
export const getAuthHeader = () =>
  inMemoryToken ? { Authorization: 'Bearer ' + inMemoryToken } : {};

export const setAuthToken = async (token) => {
  const value = typeof token === 'string' ? token.trim() : '';
  if (!value) {
    await clearAuthToken();
    return;
  }
  inMemoryToken = value;
  applyAxiosDefault(value);
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, value);
  } catch (e) {
    console.warn('authToken: failed to persist token', e?.message);
  }
};

// Call once at app start (before any authenticated request is made).
export const loadAuthToken = async () => {
  try {
    let stored = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!stored) {
      stored = await AsyncStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
    }
    inMemoryToken = stored ? String(stored).trim() || null : null;
  } catch (e) {
    console.warn('authToken: failed to load token', e?.message);
    inMemoryToken = null;
  }
  applyAxiosDefault(inMemoryToken);
  return inMemoryToken;
};

export const clearAuthToken = async () => {
  inMemoryToken = null;
  applyAxiosDefault(null);
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (e) {
    console.warn('authToken: failed to clear token', e?.message);
  }
};
