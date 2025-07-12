
'use server';

import { getAccidents, type Accident } from "@/services/accidents";
import { dbscan } from "@/lib/dbscan";
import { format, min, max, differenceInDays } from 'date-fns';

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
    points: [number, number, number][]; // [lat, lng, intensity]
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
        
        const criticalZones: CriticalZone[] = significantClusters.map((cluster) => {
            const accidentCount = cluster.length;
            
            const locations = cluster.map(acc => `${acc.addressPrefix} ${acc.address}`);
            const locationCounts = locations.reduce((acc, loc) => { acc[loc] = (acc[loc] || 0) + 1; return acc; }, {} as {[key: string]: number});
            const representativeLocation = Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b);
            
            const causes = cluster.map(acc => acc.cause);
            const causeCounts = causes.reduce((acc, cause) => { acc[cause] = (acc[cause] || 0) + 1; return acc; }, {} as {[key: string]: number});
            const causeSummary = Object.entries(causeCounts).map(([cause, count]) => `${count} por ${cause}`).join(', ');

            const topCause = Object.keys(causeCounts).reduce((a, b) => causeCounts[a] > causeCounts[b] ? a : b, 'desconocida');

            const dates = cluster.map(acc => new Date(acc.dateTime));
            const minDate = min(dates);
            const maxDate = max(dates);
            const period = `${format(minDate, 'yyyy-MM-dd')} a ${format(maxDate, 'yyyy-MM-dd')}`;
            const daysDiff = differenceInDays(maxDate, minDate);

            const accidentDates = dates.map(d => format(d, 'yyyy-MM-dd')).join(', ');

            const clusterPoints: [number, number, number][] = cluster.map(acc => [acc.latitude, acc.longitude, 1]);
            const center: [number, number] = [
                cluster.reduce((sum, acc) => sum + acc.latitude, 0) / cluster.length,
                cluster.reduce((sum, acc) => sum + acc.longitude, 0) / cluster.length
            ];


            let reason = `Alta concentración de ${accidentCount} accidentes.`;
            if (topCause !== 'desconocida') {
                reason += ` La causa principal es "${topCause.replace(/-/g, ' ')}".`;
            }
            if (daysDiff <= 30 && accidentCount > 2) {
                reason += ` Ocurrieron en un corto período de tiempo.`;
            } else if (daysDiff > 180) {
                reason += ` Se han registrado de forma recurrente en el tiempo.`
            }

            return { 
                location: representativeLocation,
                accidentCount, 
                reason,
                period,
                causeSummary,
                accidentDatesSummary: accidentDates,
                points: clusterPoints,
                center,
            };
        });
        
        const summary = `Se identificaron ${criticalZones.length} zonas críticas. La zona con más incidentes es "${criticalZones.reduce((a,b) => a.accidentCount > b.accidentCount ? a : b).location}" con ${criticalZones.reduce((a,b) => a.accidentCount > b.accidentCount ? a : b).accidentCount} accidentes.`;

        return { analysis: { criticalZones, summary } };

    } catch (error) {
        console.error("Error in runDbscanAnalysis: ", error);
        return { error: "Un error interno impidió completar el análisis." };
    }
}
