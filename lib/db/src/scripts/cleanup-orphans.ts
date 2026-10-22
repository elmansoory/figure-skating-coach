import { pool } from "../index";

// Removes rows that point at deleted parents so that `drizzle-kit push` can add
// the foreign key constraints. Safe to run repeatedly and on an empty database.
async function main() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ name: string }>(
      `SELECT table_name AS name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('athletes', 'performance_sessions', 'skating_elements', 'training_programs')`,
    );
    const tables = new Set(rows.map((r) => r.name));

    await client.query("BEGIN");

    if (tables.has("athletes") && tables.has("performance_sessions")) {
      const res = await client.query(
        `DELETE FROM performance_sessions s
         WHERE NOT EXISTS (SELECT 1 FROM athletes a WHERE a.id = s.athlete_id)`,
      );
      console.log(`Deleted ${res.rowCount} sessions without an athlete`);
    }

    if (tables.has("performance_sessions") && tables.has("skating_elements")) {
      const res = await client.query(
        `DELETE FROM skating_elements e
         WHERE NOT EXISTS (SELECT 1 FROM performance_sessions s WHERE s.id = e.session_id)`,
      );
      console.log(`Deleted ${res.rowCount} elements without a session`);
    }

    if (tables.has("athletes") && tables.has("training_programs")) {
      const res = await client.query(
        `UPDATE training_programs t SET athlete_id = NULL
         WHERE t.athlete_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM athletes a WHERE a.id = t.athlete_id)`,
      );
      console.log(`Unassigned ${res.rowCount} training programs from missing athletes`);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
