import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const authToken = cookieStore.get('auth_token');
    
    return NextResponse.json({ 
      success: true,
      hasCookie: !!authToken?.value,
      tokenPreview: authToken?.value ? `${authToken.value.substring(0, 30)}...` : null,
      allCookiesCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name)
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
