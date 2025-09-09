// scripts/publish-pacts.js
const { publishPacts } = require("@pact-foundation/pact-node");
const path = require("path");
const fs = require("fs");

async function publish() {
  const brokerUrl = process.env.PACT_BROKER_BASE_URL;
  const brokerToken = process.env.PACT_BROKER_TOKEN;
  const brokerUser = process.env.PACT_BROKER_USERNAME;
  const brokerPass = process.env.PACT_BROKER_PASSWORD;
  const version = process.env.GITHUB_SHA || `dev-${Date.now()}`;
  const tags = process.env.GITHUB_REF_NAME
    ? [process.env.GITHUB_REF_NAME]
    : ["main"];

  const pactsDir = path.resolve(process.cwd(), "pacts");

  if (!brokerUrl) {
    console.error("❌ ERROR: PACT_BROKER_BASE_URL is required");
    process.exit(1);
  }

  if (!fs.existsSync(pactsDir)) {
    console.error(`❌ ERROR: No pacts directory found at ${pactsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(pactsDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.error(`❌ ERROR: No pact files found in ${pactsDir}`);
    process.exit(1);
  }

  const options = {
    pactFilesOrDirs: [pactsDir],
    pactBroker: brokerUrl,
    consumerVersion: version,
    tags,
  };

  if (brokerToken) {
    options.pactBrokerToken = brokerToken;
  } else if (brokerUser && brokerPass) {
    options.pactBrokerUsername = brokerUser;
    options.pactBrokerPassword = brokerPass;
  } else {
    console.warn("⚠️ No auth provided, publishing without auth");
  }

  try {
    await publishPacts(options);
    console.log("✅ Pacts published to broker:", brokerUrl);
  } catch (err) {
    console.error("❌ Failed to publish pacts:", err);
    process.exit(1);
  }
}

publish();
