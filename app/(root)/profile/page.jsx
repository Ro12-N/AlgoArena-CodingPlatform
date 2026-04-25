import { getCurrentUserData } from "@/modules/auth/actions";
import PlaylistsSection from "@/modules/profile/components/playlist-section";
import ProfileStats from "@/modules/profile/components/profile-stats";
import SolvedProblems from "@/modules/profile/components/solved-problems";
import SubmissionsHistory from "@/modules/profile/components/submission-history";
import UserInfoCard from "@/modules/profile/components/user-info-card";
import { redirect } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

const ProfilePage = async () => {
  const profileData = await getCurrentUserData();

  if (!profileData) {
    redirect("/sign-in");
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
