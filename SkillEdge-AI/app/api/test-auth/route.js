import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    console.log('Test auth endpoint called');
    
    // Get JWT token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'No authentication token found',
        timestamp: new Date().toISOString()
      });
    }

    // Validate token with backend
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return NextResponse.json({
          success: true,
          authenticated: true,
          user: userData,
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json({
          success: false,
          authenticated: false,
          message: 'Token validation failed',
          status: response.status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Token validation error:', err);
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'Error validating token',
        error: err.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in test-auth:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
