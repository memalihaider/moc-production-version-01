import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json(
        { error: "Valid user UID is required" },
        { status: 400 }
      );
    }

    await adminAuth.deleteUser(uid);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting Firebase Auth user:", error);

    if (error.code === "auth/user-not-found") {
      // User already doesn't exist in Auth — treat as success
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: error.message || "Failed to delete user from authentication" },
      { status: 500 }
    );
  }
}
