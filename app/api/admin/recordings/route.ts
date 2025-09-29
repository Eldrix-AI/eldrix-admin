import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

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

    const command = new ListObjectsV2Command({
      Bucket: "deepskygallery",
      Prefix: "call-recordings/",
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return NextResponse.json([]);
    }

    const recordings = response.Contents.map((item) => ({
      key: item.Key,
      url: `https://deepskygallery.s3.us-east-2.amazonaws.com/${item.Key}`,
      size: item.Size,
      lastModified: item.LastModified,
      fileName: item.Key?.split("/").pop() || item.Key,
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
