'use server';

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";

export type Accident = {
  location: string;
  date: Date;
  cause: string;
};

export async function addAccident(accidentData: Accident) {
  try {
    const docRef = await addDoc(collection(db, "accidents"), {
      ...accidentData,
      reportedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { success: false, error: "No se pudo agregar el accidente." };
  }
}

export async function getAccidentsCount() {
    try {
        if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            console.warn("El ID del proyecto de Firebase no está configurado. Omitiendo la consulta a Firestore.");
            return 0;
        }
        const accidentsCollection = collection(db, "accidents");
        const querySnapshot = await getDocs(accidentsCollection);
        return querySnapshot.size;
    } catch (error) {
        console.error("Error al obtener el conteo de accidentes:", error);
        // En un entorno de producción, podrías querer manejar este error de forma más explícita.
        return 0;
    }
}
