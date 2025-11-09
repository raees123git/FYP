import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function DELETE(request) {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the FastAPI backend to delete account
    const response = await fetch(`${API_URL}/api/auth/delete-account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to delete account" },
        { status: response.status }
      );
    }

    // Clear the auth cookie
    const cookieStore2 = await cookies();
    cookieStore2.delete('auth_token');

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
