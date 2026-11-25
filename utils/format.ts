const pad = (value: number) => String(value).padStart(2, '0');

/** DD/MM/YYYY HH:mm:ss en hora local. */
export function formatDateTime(value: string | number | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function formatLastSeen(iso: string | null): string {
  return iso ? formatDateTime(iso) : 'Sin conexión registrada';
}