export function validateUserCreate(body: any) {
  if (!body.email) return "Email is required";
  if (!body.name) return "Name is required";
  return null;
}
