import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;
    
    // Forward the request to FastAPI backend
    const response = await fetch(`${API_URL}/api/profile/resume/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userId}`,
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