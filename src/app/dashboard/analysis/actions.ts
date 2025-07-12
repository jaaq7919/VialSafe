
'use server';

import { getAccidents, type Accident } from "@/services/accidents";
import { dbscan } from "@/lib/dbscan";
import { format, min, max } from 'date-fns';

interface AnalysisFilters {
    startDate?: string;
    endDate?: string;
    type?: string;
    cause?: string;
}

export interface Cluster {
    clusterId: number;
    accidentCount: number;
    representativeLocation: string;
    causeSummary: string;
    period: string;
    accidentDatesSummary: string; // Nuevo campo
    accidents: Accident[];
}

export async function runDbscanAnalysis(filters: AnalysisFilters): Promise<{ clusters?: Cluster[], error?: string }> {
    try {
        // 1. Get all accidents
        const allAccidents = await getAccidents();
        
        if (allAccidents.length === 0) {
            return { error: 'No hay accidentes registrados para analizar. Agregue algunos datos primero.' };
        }

        // 2. Filter accidents based on user input
        const filteredAccidents = allAccidents.filter(accident => {
            const accidentDate = new Date(accident.dateTime);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            if (startDate && accidentDate < startDate) return false;
            if (endDate) {
                // Include the whole day
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                if (accidentDate > endOfDay) return false;
            }
            if (filters.type && accident.type !== filters.type) return false;
            if (filters.cause && accident.cause !== filters.cause) return false;
            
            return true;
        });

        if (filteredAccidents.length < 2) {
            return { error: 'Se necesitan al menos 2 accidentes para realizar un análisis de cluster. Amplíe sus filtros.' };
        }

        // 3. Prepare points for DBSCAN
        const points = filteredAccidents.map(acc => [acc.latitude, acc.longitude] as [number, number]);

        // 4. Run DBSCAN
        // eps: 0.0005 degrees is roughly 55 meters. A good starting point.
        // minPts: Minimum number of points to form a dense region (a cluster).
        const clusterAssignments = dbscan(points, 0.0005, 2); 

        // 5. Process clusters
        const clusters: Accident[][] = [];
        clusterAssignments.forEach((clusterIndex, pointIndex) => {
            if (clusterIndex !== -1) { // -1 is noise
                if (!clusters[clusterIndex]) {
                    clusters[clusterIndex] = [];
                }
                clusters[clusterIndex].push(filteredAccidents[pointIndex]);
            }
        });

        if (clusters.filter(c => c && c.length > 0).length === 0) {
            // It's not an error, just no clusters found
            return { clusters: [] };
        }
        
        // 6. Format clusters for the client
        const formattedClusters: Cluster[] = clusters
            .filter(c => c && c.length > 0)
            .map((cluster, index) => {
                const accidentCount = cluster.length;
                
                // Find most common location
                const locations = cluster.map(acc => `${acc.addressPrefix} ${acc.address}`);
                const locationCounts = locations.reduce((acc, loc) => { acc[loc] = (acc[loc] || 0) + 1; return acc; }, {} as {[key: string]: number});
                const representativeLocation = Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b);
                
                // Summarize causes
                const causes = cluster.map(acc => acc.cause);
                const causeCounts = causes.reduce((acc, cause) => { acc[cause] = (acc[cause] || 0) + 1; return acc; }, {} as {[key: string]: number});
                const causeSummary = Object.entries(causeCounts).map(([cause, count]) => `${count} por ${cause}`).join(', ');

                // Get date range and summary
                const dates = cluster.map(acc => new Date(acc.dateTime));
                const period = `${format(min(dates), 'yyyy-MM-dd')} a ${format(max(dates), 'yyyy-MM-dd')}`;
                const accidentDatesSummary = dates.map(d => format(d, 'yyyy-MM-dd')).join(', ');
                
                return { 
                    clusterId: index, 
                    accidentCount, 
                    representativeLocation, 
                    causeSummary, 
                    period,
                    accidentDatesSummary, 
                    accidents: cluster 
                };
            });
            
        return { clusters: formattedClusters };

    } catch (error) {
        console.error("Error in runDbscanAnalysis: ", error);
        return { error: "Un error interno impidió completar el análisis." };
    }
}
