import "server-only";

import { prisma } from "@/lib/prisma";
import { ensureWorkspace } from "./workspace";

export async function registerUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });

  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      password: input.passwordHash,
    },
  });

  // Automatically initialize their personal workspace so first login is seamless
  await ensureWorkspace(user.id);

  return { id: user.id, email: user.email, name: user.name };
}
