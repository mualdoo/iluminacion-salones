export type ExportInfo = {
  fileName: string;
  rows: number;
  /** true si existían más filas que el máximo exportable. */
  truncated: boolean;
};