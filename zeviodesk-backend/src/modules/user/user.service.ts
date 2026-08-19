import { userRepository } from "./user.repository.js";
import { bcryptService } from "../../services/bcrypt.service.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../errors/AppError.js";
import {
  CreateUserDto,
  UpdateUserDto,
  ALL_STAFF_ROLES,
  MANAGER_ASSIGNABLE_ROLES,
  TENANT_ADMIN_ASSIGNABLE_ROLES,
} from "./user.types.js";

function formatUser(user: any) {
  const { password, setupToken, setupTokenExpiry, ...safe } = user;
  return safe;
}

/**
 * Returns the set of roles an actor is allowed to assign.
 * SUPER_ADMIN can assign any staff role.
 * TENANT_ADMIN can assign MANAGER, ADVISOR, TECHNICIAN.
 * MANAGER can only assign ADVISOR, TECHNICIAN.
 * All other roles are not permitted to assign roles at all.
 */
function assignableRolesFor(actorRole: string): readonly string[] {
  switch (actorRole) {
    case "SUPER_ADMIN":
      return ALL_STAFF_ROLES;
    case "TENANT_ADMIN":
      return TENANT_ADMIN_ASSIGNABLE_ROLES;
    case "MANAGER":
      return MANAGER_ASSIGNABLE_ROLES;
    default:
      return [];
  }
}

/**
 * Role precedence order — higher index = higher privilege.
 * An actor must have a higher precedence than the target to modify them.
 */
const ROLE_PRECEDENCE: readonly string[] = [
  "TECHNICIAN",
  "ADVISOR",
  "MANAGER",
  "TENANT_ADMIN",
  "SUPER_ADMIN",
];

/**
 * Returns true when the actor is allowed to update/delete/suspend the target.
 * Rule: the actor's precedence must be strictly higher than the target's.
 * SUPER_ADMIN can always act on anyone.
 */
function canActorModifyTarget(actorRole: string, targetRole: string): boolean {
  if (actorRole === "SUPER_ADMIN") return true;
  const actorIdx  = ROLE_PRECEDENCE.indexOf(actorRole);
  const targetIdx = ROLE_PRECEDENCE.indexOf(targetRole);
  // Both roles must be known and actor must outrank the target
  return actorIdx > -1 && targetIdx > -1 && actorIdx > targetIdx;
}

export const userService = {
  getUsers: async (tenantId?: string, staffOnly = false) => {
    const users = await userRepository.findAll(tenantId);
    const filtered = staffOnly
      ? users.filter((u) => ALL_STAFF_ROLES.includes(u.role as any))
      : users;
    return filtered.map(formatUser);
  },

  getUserById: async (id: string) => {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return formatUser(user);
  },

  createUser: async (dto: CreateUserDto, actorRole: string) => {
    if (!dto.tenantId) throw new ValidationError("Tenant ID is required");
    if (!dto.email?.trim()) throw new ValidationError("Email is required");
    if (!dto.name?.trim()) throw new ValidationError("Name is required");
    if (!dto.password || dto.password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }

    const role = dto.role || "ADVISOR";

    // Validate the actor can assign this role
    const allowed = assignableRolesFor(actorRole);
    if (!allowed.includes(role)) {
      throw new ForbiddenError(
        `Forbidden: your role (${actorRole}) is not allowed to assign the '${role}' role`
      );
    }

    const hashedPassword = await bcryptService.hash(dto.password);

    const user = await userRepository.create({
      tenantId: dto.tenantId,
      email: dto.email.trim().toLowerCase(),
      name: dto.name.trim(),
      phone: dto.phone?.trim() || null,
      address: dto.address?.trim() || null,
      emergencyContact: dto.emergencyContact?.trim() || null,
      role,
      status: dto.status || "ACTIVE",
      password: hashedPassword,
      maxConcurrentJobs: dto.maxConcurrentJobs ?? null,
    });

    return formatUser(user);
  },

  updateUser: async (id: string, dto: UpdateUserDto, actorRole: string) => {
    // Load the target to check their current role
    const target = await userRepository.findById(id);
    if (!target) throw new NotFoundError("User not found");

    // Actors may not update users with equal or higher privilege
    if (!canActorModifyTarget(actorRole, target.role)) {
      throw new ForbiddenError(
        `Forbidden: your role (${actorRole}) cannot modify a user with role '${target.role}'`
      );
    }

    const data: Record<string, unknown> = { ...dto };
    // Strip immutable / sensitive fields
    delete data.tenantId;
    delete data.password;

    if (dto.password) {
      data.password = await bcryptService.hash(dto.password);
    }

    // Validate the new role is within the actor's assignable set
    if (dto.role) {
      const allowed = assignableRolesFor(actorRole);
      if (!allowed.includes(dto.role)) {
        throw new ForbiddenError(
          `Forbidden: your role (${actorRole}) is not allowed to assign the '${dto.role}' role`
        );
      }
    }

    const user = await userRepository.update(id, data);
    return formatUser(user);
  },

  deleteUser: async (id: string, actorRole: string) => {
    // Load the target to enforce target-role hierarchy on delete too
    const target = await userRepository.findById(id);
    if (!target) throw new NotFoundError("User not found");

    if (!canActorModifyTarget(actorRole, target.role)) {
      throw new ForbiddenError(
        `Forbidden: your role (${actorRole}) cannot delete a user with role '${target.role}'`
      );
    }

    return userRepository.delete(id);
  },
};
