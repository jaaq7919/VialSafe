'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Este tipo representa cómo se reciben los datos del formulario.
export type AccidentFormData = {
  addressPrefix: string;
  address: string;
  date: Date;
  time: string;
  accidentType: string;
  cause: string;
  crossingStatus: string;
  observations?: string;
  latitude: number;
  longitude: number;
};

// Este tipo representa la estructura del documento en Firestore.
export type Accident = {
  id?: string;
  addressPrefix: string;
  address: string;
  location: string; 
  dateTime: Timestamp;
  accidentType: string;
  cause: string;
  crossingStatus: string;
  observations?: string;
  latitude: number;
  longitude: number;
  createdAt: Timestamp;
};


const accidentsCollection = collection(db, 'accidents');

// Obtener todos los accidentes
export async function getAccidents(): Promise<Accident[]> {
  const snapshot = await getDocs(accidentsCollection);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Accident, 'id'>)
  }));
}

// Añadir un nuevo accidente
export async function addAccident(data: {
  addressPrefix: string;
  address: string;
  location: string;
  dateTime: Date;
  accidentType: string;
  cause: string;
  crossingStatus: string;
  observations?: string;
  latitude: number;
  longitude: number;
}) {
  try {
    const docRef = await addDoc(accidentsCollection, {
      ...data,
      dateTime: Timestamp.fromDate(data.dateTime),
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding accident: ", error);
    throw new Error("Failed to add accident to the database.");
  }
}

// Actualizar un accidente existente
export async function updateAccident(id: string, data: {
  addressPrefix: string;
  address: string;
  location: string;
  dateTime: Date;
  accidentType: string;
  cause: string;
  crossingStatus: string;
  observations?: string;
  latitude: number;
  longitude: number;
}) {
  const accidentDoc = doc(db, 'accidents', id);
  try {
    await updateDoc(accidentDoc, {
        ...data,
        dateTime: Timestamp.fromDate(data.dateTime)
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating accident: ", error);
    throw new Error("Failed to update accident in the database.");
  }
}

// Eliminar un accidente
export async function deleteAccident(id: string) {
  const accidentDoc = doc(db, 'accidents', id);
  try {
    await deleteDoc(accidentDoc);
    return { success: true };
  } catch (error) {
    console.error("Error deleting accident: ", error);
    throw new Error("Failed to delete accident from the database.");
  }
}
