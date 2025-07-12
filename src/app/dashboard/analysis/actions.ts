
'use server';

import { analyzeCriticalZones } from '@/ai/flows/analyze-critical-zones';
import type { Accident } from '@/services/accidents';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

export async function handleAnalysis(
  filteredAccidents: Accident[],
  dateFilter: DateRange | undefined
) {
  if (filteredAccidents.length === 0) {
    return {
      error:
        'No se encontraron accidentes con los filtros aplicados. Pruebe con criterios más amplios.',
    };
  }

  const headers =
    'ubicacion,fecha,hora,tipo,causa,estado_cruce,observaciones,latitud,longitud';
  const csvData = filteredAccidents
    .map((acc) => {
      const accDate = new Date(acc.dateTime);
      return [
        `"${acc.addressPrefix} ${acc.address}"`,
        `"${format(accDate, 'yyyy-MM-dd')}"`,
        `"${format(accDate, 'HH:mm')}"`,
        `"${acc.type}"`,
        `"${acc.cause}"`,
        `"${acc.crossingStatus}"`,
        `"${acc.observations || ''}"`,
        `"${acc.latitude}"`,
        `"${acc.longitude}"`,
      ].join(',');
    })
    .join('\\n');
  const historicalAccidentData = `${headers}\\n${csvData}`;

  const fromDate = dateFilter?.from
    ? format(dateFilter.from, 'yyyy-MM-dd')
    : 'inicio';
  const toDate = dateFilter?.to
    ? format(dateFilter.to, 'yyyy-MM-dd')
    : 'fin';
  const criteria = `Analizar accidentes entre ${fromDate} y ${toDate}. Considerar una zona como crítica si tiene más de 2 accidentes.`;

  const result = await analyzeCriticalZones({
    historicalAccidentData,
    criteria,
  });

  if (result.criticalZones.length === 0) {
    return {
      error:
        'La IA no identificó zonas críticas con los filtros seleccionados. Los datos no superan los umbrales de criticidad.',
    };
  }

  return { result };
}
