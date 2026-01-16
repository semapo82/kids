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

        // Handle redirect result for mobile/web redirects
        const { getRedirectResult } = import('firebase/auth').then(mod => {
            mod.getRedirectResult(auth)
                .then((result) => {
                    if (result?.user) {
                        console.log("Redirect login success:", result.user);
                    }
                })
                .catch((error) => {
                    if (error.code !== 'auth/no-current-user') {
                        console.error("Redirect login error:", error);
                        // Only alert if it's a real error, not just "no user yet"
                        if (error.code !== 'auth/network-request-failed') {
                            alert("Error al volver del login: " + error.message);
                        }
                    }
                });
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        try {
            const isCapacitor = window.hasOwnProperty('Capacitor');

            if (isCapacitor) {
                console.log("Iniciando login nativo...");
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

                const googleUser = await GoogleAuth.signIn({
                    clientId: '483987459546-gl8vlvq35gi2q4clhtm3n83os1t71rvh.apps.googleusercontent.com'
                }).catch(err => {
                    console.error("Nativo SignIn Error:", err);
                    const code = err.code || (err.message && err.message.includes('10') ? '10' : '');
                    alert("Error nativo " + code + ": " + (err.message || JSON.stringify(err)));
                    throw err;
                });

                if (!googleUser?.authentication?.idToken) {
                    throw new Error("No se recibió el token de Google.");
                }

                // Convert native credential to Firebase credential
                const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
                const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
                await signInWithCredential(auth, credential);
            } else {
                await signInWithPopup(auth, googleProvider);
            }
        } catch (error) {
            console.error("Login failed:", error);
            // Don't alert if user just cancelled
            if (error.message !== 'User cancelled') {
                const detail = error.code ? ` (${error.code})` : '';
                alert("Error de Login: " + error.message + detail);
            }
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
