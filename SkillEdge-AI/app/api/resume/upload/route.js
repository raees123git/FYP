import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the request to FastAPI backend
    const response = await fetch(`${API_URL}/api/profile/resume/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: data.detail || "Failed to upload resume" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: error.message || "Error uploading resume" },
      { status: 500 }
    );
  }
}