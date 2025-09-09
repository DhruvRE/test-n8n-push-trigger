const path = require("path");
const fs = require("fs");
const { Pact } = require("@pact-foundation/pact");
const axios = require("axios");
const { publishPacts } = require("@pact-foundation/pact-node");

// Ensure pacts directory exists
const pactDir = path.resolve(process.cwd(), "pacts");
if (!fs.existsSync(pactDir)) fs.mkdirSync(pactDir);

// Ensure logs directory exists
const logsDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

describe("Pact with expressservice", () => {
  const provider = new Pact({
    consumer: "frontendapp",
    provider: "expressservice",
    port: 1234,
    dir: pactDir,
    log: path.join(logsDir, "pact.log"),
    logLevel: "INFO",
    spec: 3,
  });

  beforeAll(async () => {
    await provider.setup();
    // Small delay to ensure server is fully ready in CI
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    try {
      // Verify all interactions
      await provider.verify();

      // Finalize and write Pact file
      await provider.finalize();
      console.log("✅ Pact file created in:", pactDir);

      // Publish Pact if broker URL is set
      if (process.env.PACT_BROKER_BASE_URL) {
        await publishPacts({
          pactFilesOrDirs: [pactDir],
          pactBroker: process.env.PACT_BROKER_BASE_URL,
          consumerVersion: process.env.GITHUB_SHA || `dev-${Date.now()}`,
          tags: [process.env.GITHUB_REF_NAME || "main"],
        });
        console.log("✅ Pact published to broker");
      } else {
        console.log("⚠️ Skipping publish (no broker URL set)");
      }
    } catch (err) {
      console.error("❌ Pact test failed:", err);
      throw err;
    }
  });

  describe("GET /health", () => {
    beforeAll(async () => {
      await provider.addInteraction({
        state: "provider is healthy",
        uponReceiving: "a GET /health request",
        withRequest: { method: "GET", path: "/health" },
        willRespondWith: {
          status: 200,
          body: { status: "ok", message: "healthy" },
        },
      });
    });

    it("returns correct response", async () => {
      const res = await axios.get("http://127.0.0.1:1234/health");
      expect(res.data).toEqual({ status: "ok", message: "healthy" });
    });
  });
});
