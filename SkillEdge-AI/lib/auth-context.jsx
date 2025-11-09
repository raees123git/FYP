"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
    setLoading(false);
  }, []);

  const signup = async (email, password, firstName, lastName) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.detail || 'Signup failed');
        return null;
      }

      // Store token and user data
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      // Also set cookie for server-side access
      document.cookie = `auth_token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      
      setUser(data.user);

      toast.success('Account created successfully!');
      router.push('/profile');
      
      return data;
    } catch (error) {
      toast.error('An error occurred during signup');
      return null;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.detail || 'Login failed');
        return null;
      }

      // Store token and user data
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      // Also set cookie for server-side access
      document.cookie = `auth_token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      
      setUser(data.user);

      toast.success('Logged in successfully!');
      router.push('/');
      
      return data;
    } catch (error) {
      toast.error('An error occurred during login');
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Clear cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/');
  };

  const getToken = () => {
    return localStorage.getItem('auth_token');
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    getToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
