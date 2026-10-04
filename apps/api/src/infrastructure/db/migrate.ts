import { getPool } from "./pool";
import { runMigrations } from "./migrations-runner";

runMigrations((msg) => console.log(msg))
  .then(async () => {
    await (await getPool()).end();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await (await getPool()).end();
    process.exit(1);
  });
