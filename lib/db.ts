import { neon } from "@neondatabase/serverless";

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}

// Helper for typed single-row queries
export async function queryOne<T = any>(
  query: string,
  params?: any[]
): Promise<T | null> {
  const sql = getDb();
  const rows = await sql(query, params);
  return (rows[0] as T) ?? null;
}

// Helper for typed multi-row queries
export async function queryMany<T = any>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const sql = getDb();
  const rows = await sql(query, params);
  return rows as T[];
}

// Helper for insert/update/delete
export async function execute(query: string, params?: any[]) {
  const sql = getDb();
  return sql(query, params);
}
