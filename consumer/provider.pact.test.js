const path = require("path");
const { Verifier } = require("@pact-foundation/pact");
const express = require("express");

// --- Simulated provider app ---
const app = express();
app.get("/health", (req, res) =>
  res.json({ status: "ok", message: "healthy" })
);
const server = app.listen(4000, () => console.log("Provider running on 4000"));

describe("Pact Verification", () => {
  afterAll(() => server.close());

  it("validates the expectations of frontendapp", async () => {
    try {
      const opts = {
        provider: "expressservice",
        providerBaseUrl: "http://localhost:4000",
        pactUrls: [
          path.resolve(process.cwd(), "pacts/frontendapp-expressservice.json"),
        ],
        publishVerificationResult: !!process.env.PACT_BROKER_BASE_URL, // publish only if broker URL set
        providerVersion: process.env.GITHUB_SHA || `dev-${Date.now()}`,
        tags: [process.env.GITHUB_REF_NAME || "main"],
        pactBrokerUrl: process.env.PACT_BROKER_BASE_URL,
        logLevel: "INFO",
      };

      const output = await new Verifier(opts).verifyProvider();
      console.log("✅ Pact Verification Result:", output);
    } catch (err) {
      console.error("❌ Pact verification failed:", err);
      throw err;
    }
  });
});
