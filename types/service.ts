export type ServiceResult<T> = { ok: true; data: T } | { ok: false; message: string };

export type DeviceInput = {
  name: string;
  description: string;
};