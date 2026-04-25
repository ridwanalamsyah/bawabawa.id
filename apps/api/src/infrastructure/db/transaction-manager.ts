import { getPool } from "./pool";

export async function withTransaction<T>(
  task: (client: { query: <Row = any>(sql: string, params?: any[]) => Promise<{ rows: Row[]; rowCount: number }> }) => Promise<T>
): Promise<T> {
  const pool = await getPool();

  // SQLite adapter doesn't support real transactions via `connect()`.
  if (!pool.connect) {
    return await task(pool);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await task(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
