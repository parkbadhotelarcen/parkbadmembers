import type { Table, Tables } from "./schema";
export interface SheetStore {
  read(tables: Table[]): Promise<Partial<Tables>>;
}
export class DataError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
