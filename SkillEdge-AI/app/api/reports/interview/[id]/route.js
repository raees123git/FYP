import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    // Call the Python backend API
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reports/interview/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Interview report not found' },
          { status: 404 }
        );
      }
      
      const errorData = await backendResponse.json();
      console.error('Backend API error:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.detail || 'Failed to fetch interview report' 
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in get interview API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}