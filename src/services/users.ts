
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
    addDoc,
    query,
    where,
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
});

// Zod schema for updating a user (password is optional)
const updateUserSchema = addUserSchema.extend({
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
// NOTE: This only creates the user profile. The admin must create the
// user in Firebase Authentication manually.
export async function addUser(data: z.infer<typeof addUserSchema>): Promise<{ success: boolean; uid: string }> {
    try {
        const q = query(collection(db, "users"), where("email", "==", data.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error('Ya existe un usuario con este correo electrónico.');
        }

        const initials = (data.firstName[0] + (data.lastName[0] || '')).toUpperCase();
        const avatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${data.firstName} ${data.lastName}`;

        // Create the user profile document in Firestore with an auto-generated ID
        const docRef = await addDoc(usersCollection, {
            ...data,
            avatarUrl,
            initials,
            createdAt: serverTimestamp(),
        });

        // Store the auto-generated ID as the 'uid' field within the document itself
        // This decouples the Firestore document ID from the Firebase Auth UID.
        await updateDoc(docRef, { uid: docRef.id });

        return { success: true, uid: docRef.id };
    } catch (error: any) {
        console.error("Error adding user profile to Firestore: ", error);
        throw new Error(error.message || "Failed to create user profile in the database.");
    }
}


// Update a user's profile in Firestore
export async function updateUser(uid: string, data: z.infer<typeof updateUserSchema>) {
  const userDoc = doc(db, 'users', uid);
  try {
    const updateData: Partial<z.infer<typeof updateUserSchema>> & { avatarUrl?: string, initials?: string } = { ...data };
    delete updateData.id; // Remove id from data object before updating
    
    // Recalculate avatar and initials if names change
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
    return { success: true };
  } catch (error) {
    console.error("Error updating user: ", error);
    throw new Error("Failed to update user profile in the database.");
  }
}

// Delete a user's profile from Firestore
export async function deleteUser(uid: string) {
  const userDoc = doc(db, 'users', uid);
  try {
    // Note: This only deletes the Firestore profile.
    // The auth user must be deleted manually from the Firebase Console.
    // This is a security measure.
    await deleteDoc(userDoc);
    console.warn(`User profile ${uid} deleted from Firestore. Remember to delete from Firebase Auth manually.`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user profile: ", error);
    throw new Error("Failed to delete user profile from the database.");
  }
}
