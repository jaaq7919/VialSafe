
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export type SettingItem = {
  id: string; // Used for client-side list rendering key
  value: string;
  label: string;
};

export type AppSettings = {
  accidentCauses: SettingItem[];
  accidentTypes: SettingItem[];
};

const settingsDocRef = doc(db, 'app_settings', 'config');

// Get the main settings document
export async function getSettings(): Promise<AppSettings | null> {
  try {
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    } else {
      // If the document doesn't exist, create it with default empty values
      const defaultSettings: AppSettings = {
        accidentCauses: [],
        accidentTypes: [],
      };
      await setDoc(settingsDocRef, defaultSettings);
      console.log("Default settings document created.");
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error getting settings: ", error);
    throw new Error("Failed to get settings from the database.");
  }
}

// Update the main settings document
export async function updateSettings(data: Partial<AppSettings>) {
  try {
    // Using updateDoc will only update the fields provided
    // and won't overwrite the whole document if other fields exist.
    await updateDoc(settingsDocRef, data);
    return { success: true };
  } catch (error) {
    console.error("Error updating settings: ", error);
    throw new Error("Failed to update settings in the database.");
  }
}
