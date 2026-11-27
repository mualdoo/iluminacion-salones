import { useCallback, useRef, useState } from 'react';

import type { ExportInfo } from '@/types/export';
import type { ServiceResult } from '@/types/service';
import { GENERIC_ERROR } from '@/utils/supabaseErrors';

type Feedback = { type: 'error' | 'success'; message: string } | null;

function describe(info: ExportInfo): string {
  const rows = info.rows > 0 ? ` con ${info.rows} fila${info.rows === 1 ? '' : 's'}` : '';
  const base = `Archivo ${info.fileName} generado${rows}.`;
  return info.truncated
    ? `${base} Se exportaron solo los primeros ${info.rows} registros; acota el rango o los filtros para el resto.`
    : base;
}

export function useCsvExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const inFlight = useRef(false);

  const run = useCallback(async (task: () => Promise<ServiceResult<ExportInfo>>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsExporting(true);
    setFeedback(null);
    try {
      const result = await task();
      setFeedback(
        result.ok
          ? { type: 'success', message: describe(result.data) }
          : { type: 'error', message: result.message },
      );
    } catch {
      setFeedback({ type: 'error', message: GENERIC_ERROR });
    } finally {
      inFlight.current = false;
      setIsExporting(false);
    }
  }, []);

  return { isExporting, feedback, run };
}