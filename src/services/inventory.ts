
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, query, orderBy } from 'firebase/firestore';
import { z } from 'zod';
import { inventoryItemSchema, type InventoryItem } from '@/types/inventory';


const inventoryCollection = collection(db, 'inventory_items');

// Get all inventory items
export async function getInventoryItems(): Promise<InventoryItem[]> {
  const q = query(inventoryCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    } as InventoryItem;
  });
}

// Add a new inventory item
export async function addInventoryItem(data: z.infer<typeof inventoryItemSchema>) {
  try {
    const validatedData = inventoryItemSchema.parse(data);
    const docRef = await addDoc(inventoryCollection, {
      ...validatedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // createdBy: "admin_user" // Placeholder
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding inventory item: ", error);
    if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw new Error("Failed to add item to the database.");
  }
}

// Update an existing inventory item
export async function updateInventoryItem(id: string, data: z.infer<typeof inventoryItemSchema>) {
  const itemDoc = doc(db, 'inventory_items', id);
  try {
    const validatedData = inventoryItemSchema.parse(data);
    await updateDoc(itemDoc, {
        ...validatedData,
        updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating inventory item: ", error);
     if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw new Error("Failed to update item in the database.");
  }
}

// Delete an inventory item
export async function deleteInventoryItem(id: string) {
  const itemDoc = doc(db, 'inventory_items', id);
  try {
    await deleteDoc(itemDoc);
    return { success: true };
  } catch (error) {
    console.error("Error deleting inventory item: ", error);
    throw new Error("Failed to delete item from the database.");
  }
}
