import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Measurement } from '@/types/database';
import type { ExportInfo } from '@/types/export';
import type { ServiceResult } from '@/types/service';
import { buildMeasurementsCsv, buildSummaryCsv, type SummaryCsvInput } from '@/utils/csv';

// El BOM hace que Excel y LibreOffice interpreten el archivo como UTF-8 (acentos correctos).
const BOM = '\uFEFF';

const pad = (value: number) => String(value).padStart(2, '0');

function fileStamp(date: Date = new Date()): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function slugify(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  return slug || 'dispositivo';
}

async function shareCsvFile(fileName: string, content: string): Promise<ServiceResult<null>> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      return {
        ok: false,
        message: 'Este dispositivo no permite compartir archivos desde la aplicación.',
      };
    }

    const file = new File(Paths.cache, fileName);
    if (file.exists) file.delete();
    file.create();
    await file.write(BOM + content);

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Compartir reporte CSV',
      UTI: 'public.comma-separated-values-text',
    });
    return { ok: true, data: null };
  } catch {
    return {
      ok: false,
      message: 'No se pudo generar o compartir el archivo CSV. Inténtalo de nuevo.',
    };
  }
}

export async function exportMeasurementsCsv(
  deviceName: string,
  measurements: Measurement[],
  truncated = false,
): Promise<ServiceResult<ExportInfo>> {
  if (measurements.length === 0) {
    return { ok: false, message: 'No hay mediciones para exportar.' };
  }

  const fileName = `historial_${slugify(deviceName)}_${fileStamp()}.csv`;
  const shared = await shareCsvFile(fileName, buildMeasurementsCsv(deviceName, measurements));
  if (!shared.ok) return shared;
  return { ok: true, data: { fileName, rows: measurements.length, truncated } };
}

export async function exportSummaryCsv(input: SummaryCsvInput): Promise<ServiceResult<ExportInfo>> {
  const fileName = `resumen_${slugify(input.device.name)}_${fileStamp()}.csv`;
  const shared = await shareCsvFile(fileName, buildSummaryCsv(input));
  if (!shared.ok) return shared;
  return { ok: true, data: { fileName, rows: 0, truncated: false } };
}