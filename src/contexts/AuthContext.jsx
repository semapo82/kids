import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { setAuthUser } from '../utils/storage';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthUser(user);
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        try {
            // Capacitor/Android doesn't support popups
            const isCapacitor = window.hasOwnProperty('Capacitor');

            if (isCapacitor) {
                alert("Detectado entorno móvil. Iniciando login por redirección...");
                // Note: Redirect might also need extra config in Firebase (Authorized Domains)
                // and Capacitor (Intent filters).
                await signInWithPopup(auth, googleProvider);
            } else {
                await signInWithPopup(auth, googleProvider);
            }
        } catch (error) {
            console.error("Login failed:", error);
            let errorMessage = error.message;
            if (error.code === 'auth/operation-not-supported-in-this-environment') {
                errorMessage = "El login social no es compatible con el navegador interno del móvil. Por favor, asegúrate de tener configurado Firebase para Android con tus claves SHA-1.";
            }
            alert("Error de Login: " + errorMessage);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
