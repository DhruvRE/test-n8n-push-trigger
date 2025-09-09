const path = require("path");
const fs = require("fs");
const { Pact } = require("@pact-foundation/pact");
const axios = require("axios");
const { publishPacts } = require("@pact-foundation/pact-node");

// Ensure pacts directory exists
const pactDir = path.resolve(process.cwd(), "pacts");
if (!fs.existsSync(pactDir)) fs.mkdirSync(pactDir);

describe("Pact with expressservice", () => {
  const provider = new Pact({
    consumer: "frontendapp",
    provider: "expressservice",
    port: 1234,
    dir: pactDir,
    log: path.resolve(process.cwd(), "logs", "pact.log"),
    logLevel: "INFO",
    spec: 3,
  });

  beforeAll(async () => {
    await provider.setup();
  });

  afterAll(async () => {
    try {
      // Ensure all interactions were called
      await provider.verify();

      // Write Pact file
      await provider.finalize();
      console.log("✅ Pact file created in:", pactDir);

      // Publish if broker URL is set
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
      // Hit the mock server so interaction is fulfilled
      const res = await axios.get("http://localhost:1234/health");
      expect(res.data).toEqual({ status: "ok", message: "healthy" });
    });
  });
});
