
'use server';

import { getAccidents, type Accident } from "./accidents";
import { getInventoryItems, type InventoryItem } from "./inventory";
import { getRecommendations, type Recommendation } from "./recommendations";

export interface DashboardData {
    accidents: Accident[];
    inventoryItems: InventoryItem[];
    recommendations: Recommendation[];
}

export async function getDashboardData(): Promise<DashboardData> {
    try {
        const [accidents, inventoryItems, recommendations] = await Promise.all([
            getAccidents(),
            getInventoryItems(),
            getRecommendations(),
        ]);

        return {
            accidents,
            inventoryItems,
            recommendations,
        };

    } catch (error) {
        console.error("Error fetching all dashboard data:", error);
        throw new Error("Failed to load comprehensive data for the dashboard.");
    }
}

    