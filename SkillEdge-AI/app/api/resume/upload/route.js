import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the request to FastAPI backend with JWT token
    const response = await fetch(`${API_URL}/api/profile/resume/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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