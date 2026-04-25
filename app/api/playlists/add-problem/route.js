import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/actions";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { problemId, playlistId } = await request.json();

    if (!problemId || !playlistId) {
      return NextResponse.json(
        { success: false, error: "Problem ID and playlist ID are required" },
        { status: 400 }
      );
    }

    const playlist = await db.playlist.findFirst({
      where: {
        id: playlistId,
        userId: user.id,
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, error: "Playlist not found or unauthorized" },
        { status: 404 }
      );
    }

    const problemInPlaylist = await db.problemInPlaylist.create({
      data: {
        problemId,
        playlistId,
      },
    });

    return NextResponse.json({
      success: true,
      data: problemInPlaylist,
    });
  } catch (error) {
    console.error("Error adding problem to playlist:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add problem to playlist" },
      { status: 500 }
    );
  }
}
