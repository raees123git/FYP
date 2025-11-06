import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get auth token
async function getAuthToken() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

// GET: Fetch user profile data
export async function GET() {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching profile from backend");
    console.log("Calling backend at:", `${API_URL}/api/profile/`);

    try {
      // Call FastAPI backend with JWT token
      const response = await fetch(`${API_URL}/api/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          // Profile not found is expected for new users
          console.log("Profile not found for new user");
          return NextResponse.json({
            error: "Profile not found",
            initialized: false
          }, { status: 404 });
        }
        
        // Try to get error details
        let errorMessage = "Backend error";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {}
        
        console.error("Backend error:", errorMessage);
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log("Backend response data:", data);

      if (data.success && data.profile) {
        console.log("Profile found:", data.profile);
        // Transform the data to match frontend expectations
        return NextResponse.json({
          ...data.profile,
          firstName: data.profile.first_name,
          lastName: data.profile.last_name,
          // Include resume fields if they exist
          resume_filename: data.profile.resume_filename,
          resume_file_id: data.profile.resume_file_id,
          resume_uploaded_at: data.profile.resume_uploaded_at,
        });
      } else {
        console.log("No profile found for user:", userId);
        return NextResponse.json({
          error: "Profile not found",
          initialized: false
        }, { status: 404 });
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError.message);
      return NextResponse.json(
        { error: "Failed to connect to backend. Please ensure the backend server is running." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching profile:", error.message);
    return NextResponse.json(
      { error: error.message || "Error fetching profile data" },
      { status: 500 }
    );
  }
}

// PUT: Update user profile
export async function PUT(request) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    console.log("Updating profile:", data);

    // Call FastAPI backend with JWT token
    const response = await fetch(`${API_URL}/api/profile/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        profile: responseData.profile,
      });
    } else {
      console.error("Error from backend:", responseData);
      return NextResponse.json(
        { error: responseData.detail || "Error updating profile" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Error updating profile:", error.message);
    return NextResponse.json(
      { error: error.message || "Error updating profile" },
      { status: 500 }
    );
  }
}
