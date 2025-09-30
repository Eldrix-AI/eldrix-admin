import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check if the user is authenticated via cookies
    const isAuthenticated = request.cookies.has("isAuthenticated");

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    // List recordings from Vercel Blob
    const { blobs } = await list({
      prefix: "call-recordings/",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobs || blobs.length === 0) {
      return NextResponse.json([]);
    }

    const recordings = blobs.map((blob) => ({
      key: blob.pathname,
      url: blob.url,
      size: blob.size,
      lastModified: blob.uploadedAt,
      fileName: blob.pathname?.split("/").pop() || blob.pathname,
    }));

    // Sort by last modified date (newest first)
    recordings.sort(
      (a, b) =>
        new Date(b.lastModified || 0).getTime() -
        new Date(a.lastModified || 0).getTime()
    );

    return NextResponse.json(recordings);
  } catch (error) {
    console.error("Error listing recordings:", error);
    return NextResponse.json(
      { error: "Failed to list recordings" },
      { status: 500 }
    );
  }
}
