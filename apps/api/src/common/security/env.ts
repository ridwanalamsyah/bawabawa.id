export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "test") {
    return `test-${name}`;
  }
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}
