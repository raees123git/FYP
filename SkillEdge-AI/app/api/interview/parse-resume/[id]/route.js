import { cookies } from 'next/headers';
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// GET: Parse resume for interview
export async function GET(request, { params }) {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const { id } = await params;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Parsing resume for file_id:", id);

    // Call FastAPI backend
    const response = await fetch(`${API_URL}/api/interview/parse-resume/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to parse resume" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error parsing resume:", error.message);
    return NextResponse.json(
      { error: error.message || "Error parsing resume" },
      { status: 500 }
    );
  }
}