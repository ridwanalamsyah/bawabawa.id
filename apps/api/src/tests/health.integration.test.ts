import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("health endpoint", () => {
  it("returns ok response envelope", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
