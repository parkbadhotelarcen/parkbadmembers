import type { Table, Tables } from "./schema";
import type { Identity } from "@/services/contracts";
export interface SheetStore {
  read(tables: Table[], actor: Identity): Promise<Partial<Tables>>;
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
