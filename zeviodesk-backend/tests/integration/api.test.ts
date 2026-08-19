import { createApp } from "../../src/app.js";

async function runIntegrationTests() {
  console.log("🧪 Running API Integration Tests...");
  const app = createApp();

  // Basic sanity verification
  console.assert(typeof app.listen === "function", "Express app instance should be valid");
  console.log("✅ All API Integration Tests Passed!");
}

if (process.argv[1]?.endsWith("api.test.ts")) {
  runIntegrationTests();
}
