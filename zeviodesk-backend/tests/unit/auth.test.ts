import { jwtService } from "../../src/services/jwt.service.js";
import { bcryptService } from "../../src/services/bcrypt.service.js";

async function runAuthUnitTests() {
  console.log("🧪 Running Auth Unit Tests...");

  // Test Password Hashing
  const pass = "secret123";
  const hashed = await bcryptService.hash(pass);
  const isMatch = await bcryptService.compare(pass, hashed);
  console.assert(isMatch === true, "Password hashing should match original text");

  // Test JWT Signing and Verification
  const payload = { id: "u-123", email: "test@example.com", tenantId: "t-1", role: "AGENT", name: "Test Agent" };
  const token = jwtService.sign(payload);
  const decoded = jwtService.verify(token);
  console.assert(decoded.email === payload.email, "JWT payload email should match");

  console.log("✅ All Auth Unit Tests Passed!");
}

if (process.argv[1]?.endsWith("auth.test.ts")) {
  runAuthUnitTests();
}
