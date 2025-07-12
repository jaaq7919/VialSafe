'use server';

import { analyzeCriticalZones } from '@/ai/flows/analyze-critical-zones';
import type { Accident } from '@/services/accidents';
import { format, min, max } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { dbscan } from '@/lib/dbscan';

export async function handleAnalysis(
  filteredAccidents: Accident[],
  dateFilter: DateRange | undefined
) {
  if (filteredAccidents.length < 2) { // DBSCAN needs at least 2 points
    return {
      error:
        'No se encontraron suficientes accidentes con los filtros aplicados (se necesitan al menos 2). Pruebe con criterios más amplios.',
    };
  }

  // 1. Ejecutar DBSCAN para encontrar clusters
  // Epsilon (eps): 0.0005 es aprox. 55 metros. Un buen radio para agrupar accidentes en una misma intersección.
  // Puntos mínimos (minPts): 2. Un cluster debe tener al menos 2 accidentes.
  const points = filteredAccidents.map(acc => [acc.latitude, acc.longitude]);
  const clusterAssignments = dbscan(points, 0.0005, 2);

  const clusters: Accident[][] = [];
  clusterAssignments.forEach((clusterIndex, pointIndex) => {
    if (clusterIndex !== -1) { // -1 means noise in DBSCAN
      if (!clusters[clusterIndex]) {
        clusters[clusterIndex] = [];
      }
      clusters[clusterIndex].push(filteredAccidents[pointIndex]);
    }
  });


  if (!clusters || clusters.filter(c => c.length > 0).length === 0) {
      return {
          error: 'El algoritmo DBSCAN no encontró agrupaciones geográficas significativas con los datos seleccionados.'
      };
  }

  // 2. Procesar los clusters para enviar a la IA
  const accidentClusters = clusters.filter(c => c.length > 0).map((cluster, index) => {
    const accidentCount = cluster.length;

    // Ubicación representativa (la más común)
    const locations = cluster.map(acc => `${acc.addressPrefix} ${acc.address}`);
    const locationCounts = locations.reduce((acc, loc) => {
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
    }, {} as {[key: string]: number});
    const representativeLocation = Object.keys(locationCounts).reduce((a, b) => locationCounts[a] > locationCounts[b] ? a : b);

    // Resumen de causas
    const causes = cluster.map(acc => acc.cause);
    const causeCounts = causes.reduce((acc, cause) => {
        acc[cause] = (acc[cause] || 0) + 1;
        return acc;
    }, {} as {[key: string]: number});
    const causeSummary = Object.entries(causeCounts).map(([cause, count]) => `${count} por ${cause}`).join(', ');

    // Periodo del cluster
    const dates = cluster.map(acc => new Date(acc.dateTime));
    const period = `${format(min(dates), 'yyyy-MM-dd')} a ${format(max(dates), 'yyyy-MM-dd')}`;

    return {
      clusterId: index,
      accidentCount,
      representativeLocation,
      causeSummary,
      period,
    };
  });


  // 3. Llamar a la IA con los clusters pre-procesados
  const fromDate = dateFilter?.from ? format(dateFilter.from, 'yyyy-MM-dd') : 'inicio';
  const toDate = dateFilter?.to ? format(dateFilter.to, 'yyyy-MM-dd') : 'fin';
  const analysisPeriod = `Accidentes entre ${fromDate} y ${toDate}`;
  
  const result = await analyzeCriticalZones({
    accidentClusters,
    analysisPeriod,
  });

  if (result.criticalZones.length === 0) {
    return {
      error:
        'La IA analizó los clusters pero no identificó zonas que cumplan el umbral de criticidad. Los datos no sugieren puntos de alto riesgo en este momento.',
    };
  }

  return { result };
}
