import "dotenv/config";
import { createApp } from "./app";
import { loadEnv } from "./config/env";

// Validate env vars before creating the app. Crashes fast with a clear
// message when required secrets / URLs are missing or malformed.
const env = loadEnv();
const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`ERP API running on :${env.PORT} (NODE_ENV=${env.NODE_ENV})`);
});
