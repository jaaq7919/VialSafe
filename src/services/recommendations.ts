
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp, Timestamp, query, orderBy } from 'firebase/firestore';

export type RecommendationStatus = "Sugerida" | "Aprobada" | "En Ejecución" | "Implementada" | "Rechazada";

export interface Recommendation {
  id: string;
  type: "Intervención Vial" | "Puesto de Control";
  description: string;
  location: string;
  justification: string;
  status: RecommendationStatus;
  createdAt: string; // ISO string
  details?: { [key: string]: any };
}

const recommendationsCollection = collection(db, 'recommendations');

// Añadir una nueva recomendación
export async function addRecommendation(data: Omit<Recommendation, 'id' | 'createdAt' | 'status'>) {
  try {
    const docRef = await addDoc(recommendationsCollection, {
      ...data,
      status: 'Sugerida', // Default status
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding recommendation: ", error);
    throw new Error("Failed to add recommendation to the database.");
  }
}

// Obtener todas las recomendaciones
export async function getRecommendations(): Promise<Recommendation[]> {
  try {
    const q = query(recommendationsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as Recommendation;
    });
  } catch (error) {
     console.error("Error fetching recommendations: ", error);
     throw new Error("Failed to fetch recommendations.");
  }
}

// Actualizar el estado de una recomendación
export async function updateRecommendationStatus(id: string, status: RecommendationStatus) {
  const recommendationDoc = doc(db, 'recommendations', id);
  try {
    await updateDoc(recommendationDoc, { status });
    return { success: true };
  } catch (error) {
    console.error(`Error updating status for recommendation ${id}: `, error);
    throw new Error("Failed to update recommendation status.");
  }
}
