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

// GET: Fetch specific interview report with all details
export async function GET(request, { params }) {
  try {
    const userId = await getSafeUserId();
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching interview details for:", id);

    // Call FastAPI backend
    const response = await fetch(`${API_URL}/api/reports/interview/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch interview" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error fetching interview details:", error.message);
    return NextResponse.json(
      { error: error.message || "Error fetching interview details" },
      { status: 500 }
    );
  }
}