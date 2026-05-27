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

  const profileData = await getCurrentUserData();

  if (!profileData) {
    return (
      <div className="min-h-screen py-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                We couldn't load your profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your account was detected, but the profile data could not be
                loaded from the database for this request.
              </p>
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
