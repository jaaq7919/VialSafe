
'use server';

import { db, auth } from '@/lib/firebase';
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    serverTimestamp,
    getDoc,
    query,
    where,
} from 'firebase/firestore';
import { 
    createUserWithEmailAndPassword,
} from 'firebase/auth';
import { z } from 'zod';

// Zod schema for adding a new user
const addUserSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  documentNumber: z.string().min(5),
  email: z.string().email(),
  phone: z.string().min(7),
  role: z.enum(["Administrador", "Analista de Tráfico", "Operador de Tráfico"]),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

// Zod schema for updating a user (password is optional)
const updateUserSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  documentNumber: z.string().min(5),
  email: z.string().email(),
  phone: z.string().min(7),
  role: z.enum(["Administrador", "Analista de Tráfico", "Operador de Tráfico"]),
  password: z.string().min(6).optional().or(z.literal('')),
});


export type UserProfile = {
  uid: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  email: string;
  phone: string;
  role: "Administrador" | "Analista de Tráfico" | "Operador de Tráfico";
  avatarUrl: string;
  initials: string;
  createdAt: any;
};

const usersCollection = collection(db, 'users');

// Get all user profiles from Firestore
export async function getUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as UserProfile;
  });
}

// Add a new user (Auth and Firestore)
export async function addUser(data: z.infer<typeof addUserSchema>): Promise<{ success: boolean; uid: string }> {
    const { email, password, ...profileData } = data;

    // Check if user already exists in Firestore
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        throw new Error('Ya existe un usuario con este correo electrónico.');
    }

    try {
        // Step 1: Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 2: Create user profile in Firestore
        const initials = (profileData.firstName[0] + (profileData.lastName[0] || '')).toUpperCase();
        const avatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${profileData.firstName} ${profileData.lastName}`;
        
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            ...profileData,
            email,
            avatarUrl,
            initials,
            createdAt: serverTimestamp(),
        });

        return { success: true, uid: user.uid };

    } catch (error: any) {
        console.error("Error adding user:", error);
        // Handle common auth errors
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Este correo electrónico ya está registrado en el sistema de autenticación.');
        }
        if (error.code === 'auth/weak-password') {
            throw new Error('La contraseña es demasiado débil.');
        }
        throw new Error(error.message || "Failed to create user.");
    }
}


// Update a user's profile and optionally password
export async function updateUser(uid: string, data: z.infer<typeof updateUserSchema>) {
    const userDoc = doc(db, 'users', uid);
    const { password, ...profileData } = data;

    try {
        // Update Firestore profile
        const updateData: Partial<UserProfile> = { ...profileData };

        if(data.firstName || data.lastName) {
            const docSnap = await getDoc(userDoc);
            if (docSnap.exists()) {
                const existingData = docSnap.data();
                const firstName = data.firstName || existingData.firstName;
                const lastName = data.lastName || existingData.lastName;
                updateData.initials = (firstName[0] + (lastName[0] || '')).toUpperCase();
                updateData.avatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${firstName} ${lastName}`;
            }
        }
        
        await updateDoc(userDoc, updateData);
        
        // As a security best practice for client-side applications, we will not handle password updates for other users.
        // This should be done through a secure, admin-only backend or by the user themselves.
        if (password) {
             console.warn(`Password update requested for ${uid} but skipped for security reasons. Admin should use the Firebase console or an admin backend.`);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating user: ", error);
        throw new Error("Failed to update user profile in the database.");
    }
}


// Delete a user's profile from Firestore.
export async function deleteUser(uid: string) {
    const userDoc = doc(db, 'users', uid);
    try {
        // This only deletes the Firestore profile. Deleting the Auth user is a sensitive operation
        // and is not done from the client-side for security reasons.
        await deleteDoc(userDoc);
        console.warn(`User profile ${uid} deleted from Firestore. The administrator should delete the user from the Firebase Authentication console manually to revoke access.`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting user profile: ", error);
        throw new Error("Failed to delete user profile from the database.");
    }
}
