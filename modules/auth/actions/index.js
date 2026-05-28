"use server";

import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import {
  currentUser,
  getDevelopmentRole,
  isAdminEmail,
  isDevelopmentAuthFallbackEnabled,
  resolveUserEmail,
} from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";

function mapOnboardingError(error) {
  const code = error?.code;

  if (code === "P1001" || code === "P1002") {
    return "Database is unreachable. Set DATABASE_URL on Vercel (use your host’s pooled connection string) and redeploy.";
  }

  if (code === "P2021") {
    return "Database tables are missing. Run prisma migrate deploy against your production database, then redeploy.";
  }

  if (code === "P2002") {
    return "This email is already linked to another account. Contact support or use the same sign-in method you used before.";
  }

  return error?.message || "Failed to save your profile to the database.";
}

async function upsertAppUser(clerkUser, email, userData, roleUpdate) {
  try {
    return await db.user.upsert({
      where: { clerkId: clerkUser.id },
      update: { ...userData, ...roleUpdate },
      create: { clerkId: clerkUser.id, ...userData, ...roleUpdate },
    });
  } catch (error) {
    if (error?.code !== "P2002") {
      throw error;
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (!existing) {
      throw error;
    }

    return db.user.update({
      where: { id: existing.id },
      data: {
        clerkId: clerkUser.id,
        ...userData,
        ...roleUpdate,
      },
    });
  }
}

export const onBoardUser = async () => {
  try {
    noStore();
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "No authenticated user found" };
    }

    const email = resolveUserEmail(user);

    if (!email) {
      return {
        success: false,
        error:
          "No email on your Clerk account. Add an email in Clerk or sign in with Google/GitHub.",
      };
    }

    const userData = {
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      imageUrl: user.imageUrl || null,
      email,
    };

    const roleUpdate = {};
    if (isDevelopmentAuthFallbackEnabled()) {
      roleUpdate.role =
        getDevelopmentRole() === "USER" ? UserRole.USER : UserRole.ADMIN;
    } else if (isAdminEmail(email)) {
      roleUpdate.role = UserRole.ADMIN;
    }

    const newUser = await upsertAppUser(user, email, userData, roleUpdate);

    return {
      success: true,
      user: newUser,
      message: "User onboarded successfully",
    };
  } catch (error) {
    console.error("Error onboarding user:", error);
    return {
      success: false,
      error: mapOnboardingError(error),
    };
  }
};

export const currentUserRole = async () => {
  try {
    noStore();
    const onboardingResult = await onBoardUser();

    if (!onboardingResult.success) {
      return null;
    }

    return onboardingResult.user.role;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    noStore();
    const onboardingResult = await onBoardUser();

    if (!onboardingResult.success) {
      return null;
    }

    return onboardingResult.user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

const profileInclude = {
  submissions: true,
  solvedProblems: {
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          difficulty: true,
        },
      },
    },
  },
  playlists: {
    include: {
      problems: {
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true,
            },
          },
        },
      },
    },
  },
};

export const getCurrentUserData = async () => {
  try {
    noStore();
    const onboardingResult = await onBoardUser();

    if (!onboardingResult.success) {
      return { data: null, error: onboardingResult.error };
    }

    const data = await db.user.findUnique({
      where: { id: onboardingResult.user.id },
      include: profileInclude,
    });

    return {
      data,
      error: data ? null : "Profile record could not be loaded after sign-in.",
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { data: null, error: mapOnboardingError(error) };
  }
};
