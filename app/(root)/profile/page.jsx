import { AlertTriangle } from "lucide-react";
import { currentUser, isClerkConfigured } from "@/lib/auth";
import AuthStatusCard from "@/modules/auth/components/auth-status-card";
import { getCurrentUserData } from "@/modules/auth/actions";
import PlaylistsSection from "@/modules/profile/components/playlist-section";
import ProfileStats from "@/modules/profile/components/profile-stats";
import SolvedProblems from "@/modules/profile/components/solved-problems";
import SubmissionsHistory from "@/modules/profile/components/submission-history";
import UserInfoCard from "@/modules/profile/components/user-info-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export const dynamic = "force-dynamic";

const ProfilePage = async () => {
  const authUser = await currentUser();

  if (!authUser) {
    return (
      <div className="min-h-screen py-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <AuthStatusCard
            title="Sign In to View Your Profile"
            description={
              isClerkConfigured()
                ? "Your profile, submission history, solved problems, and playlists are available after you sign in."
                : "This deployment needs Clerk environment variables before profile pages can work."
            }
            authConfigured={isClerkConfigured()}
          />
        </div>
      </div>
    );
  }

  const { data: profileData, error: profileError } = await getCurrentUserData();

  if (!profileData) {
    const detail =
      profileError || "Your profile could not be loaded after sign-in.";

    return (
      <div className="min-h-screen py-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                We couldn&apos;t load your profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{detail}</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  In Vercel → Settings → Environment Variables, set{" "}
                  <code className="text-foreground">DATABASE_URL</code> to your
                  hosted Postgres URL (Neon/Supabase pooled URL).
                </li>
                <li>
                  Redeploy so{" "}
                  <code className="text-foreground">prisma migrate deploy</code>{" "}
                  runs (build uses <code className="text-foreground">vercel-build</code>
                  ).
                </li>
                <li>
                  For admin / Create Problem, set{" "}
                  <code className="text-foreground">ADMIN_EMAILS</code> to your
                  Clerk email, redeploy, then sign out and sign in again.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-32">
      <div className="container mx-auto px-4 max-w-7xl">
        <UserInfoCard userData={profileData} />

        <ProfileStats
          submissions={profileData.submissions}
          solvedCount={profileData.solvedProblems.length}
          playlistCount={profileData.playlists.length}
        />

        <SubmissionsHistory submissions={profileData.submissions} />

        <div className="grid  gap-8">
          <SolvedProblems solvedProblems={profileData.solvedProblems} />
          <PlaylistsSection playlists={profileData.playlists} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
