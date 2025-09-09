const request = require("supertest");
const app = require("./index");

describe("Express App", () => {
  it("should return health status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "ok",
      message: "Service is running",
    });
  });

  it("should return default message on /", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Hello! Your service is up and running.");
  });
});
