'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api-integration/auth';
import { setTokenProvider } from '../api-integration/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('anomalyze_token') || localStorage.getItem('token');
        }
        return null;
    });

    useEffect(() => {
        if (token) {
            setLoading(true); // Ensure we wait for profile fetch
            setTokenProvider(async () => token);
            fetchProfile();
        } else {
            setTokenProvider(async () => null);
            setUser(null);
            setLoading(false);
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const userData = await authApi.getProfile();
            setUser(userData);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            logout(); // Invalid token
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const data = await authApi.login(email, password);
        if (typeof window !== 'undefined') {
            localStorage.setItem('anomalyze_token', data.token);
        }
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (email, password, name, phone) => {
        const data = await authApi.register(email, password, name, phone);
        return data;
    };

    const verifyRegistration = async (email, otp) => {
        const data = await authApi.verifyRegistration(email, otp);
        if (typeof window !== 'undefined') {
            localStorage.setItem('anomalyze_token', data.token);
        }
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const loginWithToken = (newToken) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('anomalyze_token', newToken);
        }
        setLoading(true);
        setToken(newToken);
    };

    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('anomalyze_token');
            localStorage.removeItem('token');
        }
        setToken(null);
        setUser(null);
        setTokenProvider(async () => null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            loading,
            login,
            register,
            verifyRegistration,
            logout,
            loginWithToken,
            token
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
