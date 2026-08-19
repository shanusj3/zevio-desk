import { authRepository } from "./auth.repository.js";
import { jwtService } from "../../services/jwt.service.js";
import { bcryptService } from "../../services/bcrypt.service.js";
import { LoginDto, AuthResponseDto } from "./auth.types.js";
import { prisma } from "../../config/prisma.js";
import crypto from "crypto";
import { UnauthorizedError, ForbiddenError, ValidationError } from "../../errors/AppError.js";

const generateAndStoreRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: token, refreshTokenExpiry: expiry },
  });
  return token;
};

export const authService = {
  login: async (dto: LoginDto): Promise<AuthResponseDto> => {
    const user = await authRepository.findUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError("User account is suspended or inactive");
    }

    if (user.tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
      if (tenant && tenant.status !== "ACTIVE") {
        throw new ForbiddenError("Tenant account is suspended or inactive");
      }
    }

    const isPasswordValid = await bcryptService.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = jwtService.sign({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
    });

    const refreshToken = await generateAndStoreRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      accessToken: token,
      refreshToken,
    };
  },


  verifySetupToken: async (token: string): Promise<{ valid: boolean; reason?: "expired" | "already_used" | "invalid" }> => {
    const hashedSetupToken = crypto.createHash("sha256").update(token).digest("hex");
    const userWithToken = await prisma.user.findFirst({
      where: { setupToken: hashedSetupToken },
      include: { tenant: true },
    });

    if (!userWithToken) {
      return { valid: false, reason: "already_used" };
    }

    if (!userWithToken.setupTokenExpiry || userWithToken.setupTokenExpiry < new Date()) {
      return { valid: false, reason: "expired" };
    }

    return { valid: true };
  },

  setupPassword: async (token: string, password: string): Promise<AuthResponseDto> => {
    const user = await authRepository.findUserBySetupToken(token);
    
    if (!user) {
      throw new ValidationError("Invalid or expired setup token");
    }

    const hashedPassword = await bcryptService.hash(password);
    
    const updatedUser = await authRepository.updateUser(user.id, {
      password: hashedPassword,
      status: "ACTIVE",
      setupToken: null,
      setupTokenExpiry: null,
    });

    if (updatedUser.tenantId) {
      await prisma.tenant.update({
        where: { id: updatedUser.tenantId },
        data: { status: "ACTIVE" },
      });
    }

    const jwtToken = jwtService.sign({
      id: updatedUser.id,
      email: updatedUser.email,
      tenantId: updatedUser.tenantId,
      role: updatedUser.role,
      name: updatedUser.name,
    });

    const refreshToken = await generateAndStoreRefreshToken(updatedUser.id);

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        tenantId: updatedUser.tenantId,
      },
      accessToken: jwtToken,
      refreshToken,
    };
  },

  refreshToken: async (token: string): Promise<AuthResponseDto> => {
    if (!token) throw new ValidationError("Refresh token required");

    const user = await prisma.user.findFirst({
      where: { refreshToken: token },
    });

    if (!user) {
      throw new ValidationError("Invalid refresh token");
    }

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError("User account is suspended or inactive");
    }

    if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
      throw new ValidationError("Refresh token expired");
    }

    if (user.tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
      if (tenant && tenant.status !== "ACTIVE") {
        throw new ForbiddenError("Tenant account is suspended or inactive");
      }
    }

    const accessToken = jwtService.sign({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
    });

    const newRefreshToken = await generateAndStoreRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
};
