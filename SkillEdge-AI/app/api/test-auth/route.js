import { NextResponse } from 'next/server';
import { currentUser, getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    console.log('Test auth endpoint called');
    
    // Try multiple ways to get authentication
    let userId = null;
    let authMethod = 'none';
    
    try {
      // Method 1: Try getAuth
      const auth = getAuth(request);
      userId = auth?.userId;
      if (userId) authMethod = 'getAuth';
      console.log('Method 1 (getAuth):', { userId, hasAuth: !!auth });
    } catch (err) {
      console.log('Method 1 failed:', err.message);
    }
    
    if (!userId) {
      try {
        // Method 2: Try currentUser
        const user = await currentUser();
        userId = user?.id;
        if (userId) authMethod = 'currentUser';
        console.log('Method 2 (currentUser):', { userId, hasUser: !!user });
      } catch (err) {
        console.log('Method 2 failed:', err.message);
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No user ID found with any method',
          authResult: 'No authentication',
          clerkVersion: '@clerk/nextjs ^6.18.2'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication working',
      userId: userId,
      authMethod: authMethod,
      clerkVersion: '@clerk/nextjs ^6.18.2',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in test-auth:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack,
        clerkVersion: '@clerk/nextjs ^6.18.2'
      },
      { status: 500 }
    );
  }
}
