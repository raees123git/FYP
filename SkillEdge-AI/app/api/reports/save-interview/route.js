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

// POST: Save interview report with all data
export async function POST(request) {
  try {
    const userId = await getSafeUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    console.log("Saving interview report for user:", userId);

    // Call FastAPI backend
    const response = await fetch(`${API_URL}/api/reports/save-interview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.detail || "Failed to save interview" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error saving interview report:", error.message);
    return NextResponse.json(
      { error: error.message || "Error saving interview report" },
      { status: 500 }
    );
  }
}