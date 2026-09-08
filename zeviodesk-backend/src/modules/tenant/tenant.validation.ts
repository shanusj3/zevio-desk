const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[\+\d\s\-\(\)]{7,30}$/;
const subdomainRegex = /^[a-z0-9-]+$/;

export function validateTenantPayload(body: any, isUpdate = false) {
  if (!body) return "Request body is empty";

  // Name validation
  if (!body.name) return "Tenant name is required";
  if (typeof body.name !== "string") return "Tenant name must be a string";
  if (body.name.length < 2) return "Tenant name must be at least 2 characters";
  if (body.name.length > 50) return "Tenant name must not exceed 50 characters";

  // Description validation
  if (body.description !== undefined && body.description !== null && body.description !== "") {
    if (typeof body.description !== "string") return "Description must be a string";
    if (body.description.length > 200) return "Description must not exceed 200 characters";
  }

  // Subdomain validation
  if (!isUpdate) {
    if (!body.subdomain) return "Subdomain is required";
    if (typeof body.subdomain !== "string") return "Subdomain must be a string";
    if (body.subdomain.length < 2) return "Subdomain must be at least 2 characters";
    if (body.subdomain.length > 30) return "Subdomain must not exceed 30 characters";
    if (!subdomainRegex.test(body.subdomain)) return "Subdomain can only contain lowercase letters, numbers, and hyphens";
  } else {
    if (body.subdomain !== undefined && body.subdomain !== null) {
      if (typeof body.subdomain !== "string") return "Subdomain must be a string";
      if (body.subdomain.length < 2) return "Subdomain must be at least 2 characters";
      if (body.subdomain.length > 30) return "Subdomain must not exceed 30 characters";
      if (!subdomainRegex.test(body.subdomain)) return "Subdomain can only contain lowercase letters, numbers, and hyphens";
    }
  }

  // Business Email validation
  if (!body.businessEmail) return "Business email is required";
  if (typeof body.businessEmail !== "string") return "Business email must be a string";
  if (body.businessEmail.length > 100) return "Business email must not exceed 100 characters";
  if (!emailRegex.test(body.businessEmail)) return "Invalid business email address";

  // Phone validation
  if (!body.phone) return "Phone number is required";
  if (typeof body.phone !== "string") return "Phone number must be a string";
  if (body.phone.length > 30) return "Phone number must not exceed 30 characters";
  if (!phoneRegex.test(body.phone)) return "Phone number must be exactly 10 digits after the country code";

  // GST Number validation
  if (body.gstNumber !== undefined && body.gstNumber !== null && body.gstNumber !== "") {
    if (typeof body.gstNumber !== "string") return "GST number must be a string";
    if (body.gstNumber.length > 15) return "GST number must not exceed 15 characters";
  }

  // Address validation
  if (body.address !== undefined && body.address !== null && body.address !== "") {
    if (typeof body.address !== "string") return "Address must be a string";
    if (body.address.length > 500) return "Address must not exceed 500 characters";
  }

  // Primary Color validation
  if (!body.primaryColor) return "Primary color is required";
  if (typeof body.primaryColor !== "string") return "Primary color must be a string";
  if (body.primaryColor.length > 20) return "Primary color must not exceed 20 characters";

  // Secondary Color validation
  if (body.secondaryColor !== undefined && body.secondaryColor !== null && body.secondaryColor !== "") {
    if (typeof body.secondaryColor !== "string") return "Secondary color must be a string";
    if (body.secondaryColor.length > 20) return "Secondary color must not exceed 20 characters";
  }

  // Admin Name validation
  if (!body.adminName) return "Admin full name is required";
  if (typeof body.adminName !== "string") return "Admin full name must be a string";
  if (body.adminName.length < 2) return "Admin full name must be at least 2 characters";
  if (body.adminName.length > 50) return "Admin full name must not exceed 50 characters";

  // Admin Email validation
  if (!body.adminEmail) return "Admin email is required";
  if (typeof body.adminEmail !== "string") return "Admin email must be a string";
  if (body.adminEmail.length > 100) return "Admin email must not exceed 100 characters";
  if (!emailRegex.test(body.adminEmail)) return "Invalid admin email address";

  // Admin Phone validation
  if (!body.adminPhone) return "Admin phone number is required";
  if (typeof body.adminPhone !== "string") return "Admin phone number must be a string";
  if (body.adminPhone.length > 30) return "Admin phone number must not exceed 30 characters";
  if (!phoneRegex.test(body.adminPhone)) return "Admin phone number must be exactly 10 digits after the country code";

  // Logo URL validation
  if (body.logoUrl !== undefined && body.logoUrl !== null && body.logoUrl !== "") {
    if (typeof body.logoUrl !== "string") return "Logo URL must be a string";
    if (body.logoUrl.length > 1000) return "Logo URL must not exceed 1000 characters";
  }

  return null;
}
