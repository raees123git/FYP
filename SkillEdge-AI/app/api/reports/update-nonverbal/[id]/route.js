import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get a safe user ID
async function getSafeUserId() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    // Clean up userId to ensure it's safe for DB
    return userId.replace(/[^a-zA-Z0-9_-]/g, '');
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}

// PUT: Update non-verbal report for an interview
export async function PUT(request, { params }) {
  try {
    const userId = await getSafeUserId();
    const { id } = params; // interview_id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    console.log("Updating non-verbal report for interview:", id);

    // Call FastAPI backend
    const response = await fetch(`${API_URL}/api/reports/update-nonverbal/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to update non-verbal report" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error updating non-verbal report:", error.message);
    return NextResponse.json(
      { error: error.message || "Error updating non-verbal report" },
      { status: 500 }
    );
  }
}