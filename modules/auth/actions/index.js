"use server";

import { db } from "@/lib/db";
import {
  currentUser,
  getDevelopmentRole,
  isDevelopmentAuthFallbackEnabled,
  isClerkConfigured,
} from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";

const getPrimaryEmail = (user) =>
  user?.emailAddresses?.[0]?.emailAddress ||
  process.env.DEV_USER_EMAIL ||
  "developer@local.test";

export const onBoardUser = async () => {
  try {
    noStore();
    const user = await currentUser();

    if (!user) {
      return { success: false, error: "No authenticated user found" };
    }

    const userData = {
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      imageUrl: user.imageUrl || null,
      email: getPrimaryEmail(user),
    };

    const localRole = isDevelopmentAuthFallbackEnabled()
      ? { role: getDevelopmentRole() }
      : {};

    const newUser = await db.user.upsert({
      where: {
        clerkId: user.id,
      },
      update: {
        ...userData,
        ...localRole,
      },
      create: {
        clerkId: user.id,
        ...userData,
        ...localRole,
      },
    });

    return {
      success: true,
      user: newUser,
      message: "User onboarded successfully",
    };
  } catch (error) {
    console.error("Error onboarding user:", error);
    return {
      success: false,
      error: "Failed to onboard user",
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

export const getCurrentUserData = async () => {
  try {
    noStore();
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    return db.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        submissions: true,
        solvedProblems: true,
        playlists: true,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};
