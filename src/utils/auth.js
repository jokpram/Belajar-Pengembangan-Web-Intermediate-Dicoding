//auth.js
import database from './database.js';

const AUTH_TOKEN_KEY = 'story_app_token';
const USER_KEY = 'story_app_user';

// Enhanced auth functions with offline support
export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function isLoggedIn() {
  return !!getAuthToken() || !!getUser();
}

export async function logout() {
  removeAuthToken();
  localStorage.removeItem(USER_KEY);
  
  // Clear IndexedDB data on logout
  try {
    await database.clearAllData();
  } catch (error) {
    console.error('Error clearing database on logout:', error);
  }
  
  window.location.hash = 'home';
}

// Enhanced authentication with offline support
export async function login(credentials) {
  try {
    // Try online login first
    const response = await fetch('https://story-api.dicoding.dev/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const result = await response.json();
    
    // Save token and user data
    setAuthToken(result.loginResult.token);
    setUser(result.loginResult);
    
    // Also save to IndexedDB for offline access
    await database.savePreference('onlineUser', result.loginResult);
    
    return result;
  } catch (error) {
    console.log('Online login failed, trying offline login:', error);
    
    // Try offline login
    try {
      const offlineUser = await database.loginUser(credentials.email, credentials.password);
      
      // Set offline user
      setUser({
        ...offlineUser,
        isOffline: true
      });
      
      return {
        loginResult: offlineUser,
        message: 'Logged in offline mode'
      };
    } catch (offlineError) {
      throw new Error('Login failed. Please check your credentials and internet connection.');
    }
  }
}

export async function register(userData) {
  try {
    // Try online registration first
    const response = await fetch('https://story-api.dicoding.dev/v1/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const result = await response.json();
    
    // Also save to IndexedDB for offline access
    await database.registerUser({
      ...userData,
      userId: result.userId
    });
    
    return result;
  } catch (error) {
    console.log('Online registration failed, trying offline registration:', error);
    
    // Try offline registration
    try {
      const offlineUser = await database.registerUser(userData);
      
      return {
        userId: offlineUser.email,
        message: 'Registered in offline mode. You can use the app offline.'
      };
    } catch (offlineError) {
      throw new Error('Registration failed. Please check your internet connection.');
    }
  }
}

// Hapus function isOnline dari sini karena sudah ada di api.js
// Gunakan import dari api.js saja

// Get current authentication status with offline support
export async function getAuthStatus() {
  const onlineUser = getUser();
  const offlineUser = await database.getCurrentUser();
  
  return {
    isAuthenticated: !!(onlineUser || offlineUser),
    user: onlineUser || offlineUser,
    isOfflineMode: !!offlineUser && !onlineUser
  };
}

// Auth header for API requests
export function getAuthHeader() {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Check if user needs to login
export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.hash = 'login';
    return false;
  }
  return true;
}