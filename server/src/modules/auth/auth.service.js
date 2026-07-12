import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import * as authRepository from "./auth.repository.js";

export const registerUser = async (data) => {
  const { firstName, lastName, email, password, departmentId } = data;
  const existing = await authRepository.findByEmail(email);

  if (existing) {
    throw new ApiError(409, "Email address is already registered");
  }

  const employeeRole = await prisma.role.findFirst({
    where: { name: "Employee" },
  });

  if (!employeeRole) {
    throw new ApiError(500, "Default role not configured");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      roleId: employeeRole.id,
      departmentId,
      status: "ACTIVE",
    },
    include: { role: true,department: true },
  });

  return user;
};

export const loginUser = async (data) => {
  const { email, password } = data;

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: { role: true, department: true  },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new ApiError(
      403,
      `Account status is ${user.status}. Please contact support.`,
    );
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "fallback-secret-key-123",
    { expiresIn: process.env.JWT_EXPIRY || "24h" },
  );

  return { token, user };
};


export const getUserProfile = async (id) => {
  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { role: true , department: true},
  });
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }
  return user;
};


export const updatePassword = async (id, data) => {
  const { currentPassword, newPassword } = data;

  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
  });
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    throw new ApiError(400, 'Incorrect current password');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });


  return true;
};
