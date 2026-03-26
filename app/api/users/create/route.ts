import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Valid password is required" }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({
      email: email.trim().toLowerCase(),
      password,
      emailVerified: false,
      disabled: false,
    });

    return NextResponse.json({ uid: userRecord.uid });
  } catch (error: any) {
    console.error("Error creating Firebase Auth user:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
