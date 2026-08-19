// Roles that exist within a tenant (excludes SUPER_ADMIN and CUSTOMER)
export const ALL_STAFF_ROLES = ["TENANT_ADMIN", "MANAGER", "ADVISOR", "TECHNICIAN"] as const;

/**
 * Roles a MANAGER is allowed to assign.
 * Managers cannot create or promote to TENANT_ADMIN.
 */
export const MANAGER_ASSIGNABLE_ROLES = ["ADVISOR", "TECHNICIAN"] as const;

/**
 * Roles a TENANT_ADMIN is allowed to assign.
 * TENANT_ADMIN cannot create another TENANT_ADMIN — only SUPER_ADMIN can.
 */
export const TENANT_ADMIN_ASSIGNABLE_ROLES = ["MANAGER", "ADVISOR", "TECHNICIAN"] as const;

export type StaffRole = (typeof ALL_STAFF_ROLES)[number];
export type ManagerAssignableRole = (typeof MANAGER_ASSIGNABLE_ROLES)[number];
export type TenantAdminAssignableRole = (typeof TENANT_ADMIN_ASSIGNABLE_ROLES)[number];
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface UserDto {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  role: string;
  status: UserStatus;
  maxConcurrentJobs?: number;
  createdAt: string;
}

export interface CreateUserDto {
  tenantId?: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  role?: StaffRole;
  status?: UserStatus;
  password: string;
  maxConcurrentJobs?: number;
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, "password">> {
  password?: string;
}
