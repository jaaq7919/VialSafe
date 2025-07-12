
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export interface UserProfile {
    uid: string;
    firstName: string;
    lastName: string;
    role: "Administrador" | "Analista de Tráfico" | "Operador de Tráfico";
    avatarUrl: string;
    initials: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<any>;
    logout: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (user: User) => {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUserProfile({
                uid: user.uid,
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                role: profileData.role,
                avatarUrl: profileData.avatarUrl,
                initials: profileData.initials,
            } as UserProfile);
        } else {
            console.warn(`No user profile found in Firestore for UID: ${user.uid}`);
            setUserProfile(null);
        }
    };
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            if (user) {
                setUser(user);
                await fetchUserProfile(user);
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        if (userCredential.user) {
            await fetchUserProfile(userCredential.user);
        }
        return userCredential;
    };

    const logout = () => {
        setUser(null);
        setUserProfile(null);
        return signOut(auth);
    };

    const value = {
        user,
        userProfile,
        loading,
        login,
        logout,
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
