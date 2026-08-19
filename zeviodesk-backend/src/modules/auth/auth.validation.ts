export function validateLoginPayload(body: any) {
  if (!body?.email) return "Email is required";
  if (typeof body.email !== "string") return "Email must be a string";
  if (!body?.password) return "Password is required";
  if (typeof body.password !== "string") return "Password must be a string";
  if (body.password.length < 2) return "Password must be at least 2 characters";
  if (body.password.length > 128) return "Password must not exceed 128 characters";
  return null;
}

