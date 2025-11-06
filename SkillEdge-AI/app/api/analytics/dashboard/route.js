import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request) {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/analytics/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch analytics dashboard");
    }

    const data = await response.json();
    // Backend returns { success: true, data: {...} }
    // Return just the data part
    return NextResponse.json(data.success ? data.data : data);
  } catch (error) {
    console.error("Error fetching analytics dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics dashboard" },
      { status: 500 }
    );
  }
}
