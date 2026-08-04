import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Ambil record user secara utuh tanpa 'select' terisolasi
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        // Ambil string password/hash terdaftar secara fleksibel
        const passwordInDb = (user as Record<string, unknown>).passwordHash ?? (user as Record<string, unknown>).password;
        
        if (typeof passwordInDb !== "string") {
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, passwordInDb);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: (user as Record<string, unknown>).role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
};

export async function auth() {
  const { getServerSession } = await import("next-auth");
  return getServerSession(authOptions);
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }
  if (!allowedRoles.includes(session.user.role)) {
    return { ok: false, status: 403, message: "Forbidden: insufficient permissions" };
  }
  return { ok: true, status: 200, user: session.user };
}
