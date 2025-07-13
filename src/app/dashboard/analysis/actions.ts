
'use server';

import { getAccidents, type Accident } from "@/services/accidents";
import { dbscan } from "@/lib/dbscan";
import { format, min, max, differenceInDays } from 'date-fns';
import { analyzeCriticalZones } from "@/ai/flows/analyze-critical-zones";
import type { AnalyzeCriticalZonesInput, AnalyzeCriticalZonesOutput } from "@/ai/flows/analyze-critical-zones.types";

interface AnalysisFilters {
    startDate?: string;
    endDate?: string;
    type?: string;
    cause?: string;
}

export interface CriticalZone {
    location: string;
    accidentCount: number;
    reason: string;
    period: string;
    causeSummary: string;
    accidentDatesSummary: string;
    points: [number, number][];
    center: [number, number];
}

export interface AnalysisResult {
    criticalZones: CriticalZone[];
    summary: string;
}


export async function runDbscanAnalysis(filters: AnalysisFilters): Promise<{ analysis?: AnalysisResult, error?: string }> {
    try {
        const allAccidents = await getAccidents();
        
        if (allAccidents.length === 0) {
            return { error: 'No hay accidentes registrados para analizar. Agregue algunos datos primero.' };
        }

        const filteredAccidents = allAccidents.filter(accident => {
            const accidentDate = new Date(accident.dateTime);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            if (startDate) {
                const startOfDay = new Date(startDate);
                startOfDay.setHours(0, 0, 0, 0);
                if (accidentDate < startOfDay) return false;
            }
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                if (accidentDate > endOfDay) return false;
            }
            if (filters.type && filters.type !== 'all' && accident.type !== filters.type) return false;
            if (filters.cause && filters.cause !== 'all' && accident.cause !== filters.cause) return false;
            
            return true;
        });

        if (filteredAccidents.length < 2) {
            return { error: 'Se necesitan al menos 2 accidentes que coincidan con los filtros para realizar un análisis. Pruebe ampliando los criterios.' };
        }

        const points = filteredAccidents.map(acc => [acc.latitude, acc.longitude] as [number, number]);
        const clusterAssignments = dbscan(points, 0.0005, 2); 

        const clusters: Accident[][] = [];
        clusterAssignments.forEach((clusterIndex, pointIndex) => {
            if (clusterIndex !== -1) { 
                if (!clusters[clusterIndex]) {
                    clusters[clusterIndex] = [];
                }
                clusters[clusterIndex].push(filteredAccidents[pointIndex]);
            }
        });

        const significantClusters = clusters.filter(c => c && c.length > 0);
        
        if (significantClusters.length === 0) {
            return { analysis: { criticalZones: [], summary: "Análisis completado. No se encontraron agrupaciones de accidentes (zonas críticas) con los criterios actuales." } };
        }
        
        const accidentClustersForAI = significantClusters.map((cluster, index) => {
             const accidentCount = cluster.length;
            const locations = cluster.map(acc => `${acc.addressPrefix} ${acc.address}`);
            const locationCounts = locations.reduce((acc, loc) => { acc[loc] = (acc[loc] || 0) + 1; return acc; }, {} as {[key: string]: number});
            const representativeLocation = Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b);
            const causes = cluster.map(acc => acc.cause);
            const causeCounts = causes.reduce((acc, cause) => { acc[cause] = (acc[cause] || 0) + 1; return acc; }, {} as {[key: string]: number});
            const causeSummary = Object.entries(causeCounts).map(([cause, count]) => `${count} por ${cause}`).join(', ');
            const dates = cluster.map(acc => new Date(acc.dateTime));
            const period = `${format(min(dates), 'yyyy-MM-dd')} a ${format(max(dates), 'yyyy-MM-dd')}`;
            
            return {
                clusterId: index,
                accidentCount,
                representativeLocation,
                causeSummary,
                period
            };
        });

        const analysisPeriod = (filters.startDate && filters.endDate) 
            ? `del ${filters.startDate} al ${filters.endDate}` 
            : 'de todo el periodo histórico';
            
        const aiInput: AnalyzeCriticalZonesInput = {
            accidentClusters: accidentClustersForAI,
            analysisPeriod: analysisPeriod
        };
        
        const aiResult: AnalyzeCriticalZonesOutput = await analyzeCriticalZones(aiInput);
        
        const criticalZones: CriticalZone[] = aiResult.criticalZones.map((zone) => {
            // Find the original cluster that corresponds to this AI-analyzed zone
            const originalCluster = significantClusters.find(c => {
                 const locations = c.map(acc => `${acc.addressPrefix} ${acc.address}`);
                 const locationCounts = locations.reduce((acc, loc) => { acc[loc] = (acc[loc] || 0) + 1; return acc; }, {} as {[key: string]: number});
                 const representativeLocation = Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b);
                 return representativeLocation === zone.location;
            });
            
            if (!originalCluster) return null;

            const dates = originalCluster.map(acc => new Date(acc.dateTime));
            const minDate = min(dates);
            const maxDate = max(dates);
            
            const clusterPoints: [number, number][] = originalCluster.map(acc => [acc.latitude, acc.longitude]);
            const center: [number, number] = [
                originalCluster.reduce((sum, acc) => sum + acc.latitude, 0) / originalCluster.length,
                originalCluster.reduce((sum, acc) => sum + acc.longitude, 0) / originalCluster.length
            ];
            
            const causes = originalCluster.map(acc => acc.cause);
            const causeCounts = causes.reduce((acc, cause) => { acc[cause] = (acc[cause] || 0) + 1; return acc; }, {} as {[key: string]: number});


            return { 
                location: zone.location,
                accidentCount: zone.accidentCount,
                reason: zone.reason,
                period: `${format(minDate, 'yyyy-MM-dd')} a ${format(maxDate, 'yyyy-MM-dd')}`,
                causeSummary: Object.entries(causeCounts).map(([cause, count]) => `${count} por ${cause}`).join(', '),
                accidentDatesSummary: dates.map(d => format(d, 'yyyy-MM-dd')).join(', '),
                points: clusterPoints,
                center,
            };
        }).filter((z): z is CriticalZone => z !== null);
        
        return { analysis: { criticalZones, summary: aiResult.summary } };

    } catch (error) {
        console.error("Error in runDbscanAnalysis: ", error);
        return { error: "Un error interno impidió completar el análisis." };
    }
}
