
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
    getDoc
} from 'firebase/firestore';
import { 
    createUserWithEmailAndPassword, 
    deleteUser as deleteAuthUser 
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
  password: z.string().min(6), // Password is required for creation
});

// Zod schema for updating a user (password is optional)
const updateUserSchema = addUserSchema.omit({ password: true });

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

// Add a new user to Firebase Auth and Firestore
export async function addUser(data: z.infer<typeof addUserSchema>) {
    // Note: Creating users requires admin privileges or specific security rules.
    // This function will fail if not run by an authenticated admin user.
    // For simplicity, we assume the currently logged-in user has permissions.
    // A more robust solution uses Firebase Cloud Functions to create users.
    
    // We create a temporary, secondary Firebase app instance to create the user
    // This avoids forcing the current admin to sign out.
    
    // As Firebase Admin SDK is not available on client/edge, we can't directly create user.
    // The current Firebase Auth SDK doesn't support creating users other than the current one.
    // A Firebase Cloud Function is the standard way to handle this.

    // **SIMULATION for this environment:**
    // We'll throw an error and explain the limitation. For a real app, this would be a call to a Cloud Function.
    
    throw new Error("La creación de usuarios directamente desde el cliente no está soportada por seguridad. Se debe implementar una Cloud Function para esta tarea.");
    
    /*
    // --- Example code for a Cloud Function context ---
    
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const { user } = userCredential;

    // 2. Prepare profile data for Firestore
    const initials = (data.firstName[0] + (data.lastName[0] || '')).toUpperCase();
    const avatarUrl = `https://i.pravatar.cc/150?u=${data.email}`;

    const userProfile = {
      firstName: data.firstName,
      lastName: data.lastName,
      documentNumber: data.documentNumber,
      email: data.email,
      phone: data.phone,
      role: data.role,
      avatarUrl,
      initials,
      createdAt: serverTimestamp(),
    };

    // 3. Save profile to Firestore with the user's UID as document ID
    await setDoc(doc(db, "users", user.uid), userProfile);

    return { success: true, uid: user.uid };
    */
}

// Update a user's profile in Firestore
export async function updateUser(uid: string, data: z.infer<typeof updateUserSchema>) {
  const userDoc = doc(db, 'users', uid);
  try {
    const updateData = {
        ...data
    };
    delete updateData.id; // Remove id from data object before updating
    await updateDoc(userDoc, updateData);
    return { success: true };
  } catch (error) {
    console.error("Error updating user: ", error);
    throw new Error("Failed to update user profile in the database.");
  }
}

// Delete a user's profile from Firestore
export async function deleteUser(uid: string) {
    // Similar to addUser, deleting a user from Auth should be done via a Cloud Function for security.
    // We will only delete the Firestore document here.
  const userDoc = doc(db, 'users', uid);
  try {
    await deleteDoc(userDoc);
    // You would then call a cloud function to delete the user from Auth:
    // const deleteUserFunction = httpsCallable(functions, 'deleteUser');
    // await deleteUserFunction({ uid });
    
    console.warn(`User profile ${uid} deleted from Firestore. Remember to delete from Firebase Auth via a Cloud Function.`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user profile: ", error);
    throw new Error("Failed to delete user profile from the database.");
  }
}
