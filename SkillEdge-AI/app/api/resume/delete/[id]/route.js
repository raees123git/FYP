import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;
    
    // Forward the request to FastAPI backend with JWT token
    const response = await fetch(`${API_URL}/api/profile/resume/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(
        { error: data.detail || "Failed to delete resume" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Resume delete error:", error);
    return NextResponse.json(
      { error: error.message || "Error deleting resume" },
      { status: 500 }
    );
  }
}