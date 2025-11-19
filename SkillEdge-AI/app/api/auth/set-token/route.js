import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { token } = await request.json();
    
    console.log('🍪 [Set-Token] Setting cookie:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 30)}...` : 'none'
    });
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Set the auth token as an HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('✅ [Set-Token] Cookie set successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [Set-Token] Error setting token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set token' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete token' },
      { status: 500 }
    );
  }
}
