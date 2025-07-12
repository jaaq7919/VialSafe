
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
    addDoc
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
  password: z.string().optional(), // Password is now optional in the schema
});

// Zod schema for updating a user (password is optional)
const updateUserSchema = addUserSchema.omit({ password: true }).extend({
    id: z.string().optional(),
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

// Add a new user profile to Firestore
export async function addUser(data: z.infer<typeof addUserSchema>) {
    // SECURITY NOTE: We are only creating the user profile in Firestore, not in Firebase Auth.
    // To enable login, the administrator must manually create the user in the Firebase Console (Authentication)
    // with the same email and a password. This is a workaround because creating auth users
    // from the client-side is restricted for security reasons. The standard solution is a Cloud Function.

    try {
        const initials = (data.firstName[0] + (data.lastName[0] || '')).toUpperCase();
        // Using a placeholder avatar service
        const avatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${data.firstName} ${data.lastName}`;

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

        // We use addDoc to let Firestore generate the UID, which we will use as our reference.
        const docRef = await addDoc(collection(db, "users"), userProfile);

        return { success: true, uid: docRef.id };
    } catch (error) {
        console.error("Error adding user profile to Firestore: ", error);
        throw new Error("Failed to create user profile in the database.");
    }
}


// Update a user's profile in Firestore
export async function updateUser(uid: string, data: z.infer<typeof updateUserSchema>) {
  const userDoc = doc(db, 'users', uid);
  try {
    const updateData: Partial<z.infer<typeof updateUserSchema>> = { ...data };
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
    // Deleting the auth user should be done via a Cloud Function for security.
    // This implementation only deletes the Firestore document.
  const userDoc = doc(db, 'users', uid);
  try {
    await deleteDoc(userDoc);
    console.warn(`User profile ${uid} deleted from Firestore. Remember to delete from Firebase Auth via a Cloud Function or manually in the console.`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user profile: ", error);
    throw new Error("Failed to delete user profile from the database.");
  }
}
