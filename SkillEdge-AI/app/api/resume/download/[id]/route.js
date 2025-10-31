import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;
    
    // Forward the request to FastAPI backend with JWT token
    const response = await fetch(`${API_URL}/api/profile/resume/download/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      // Get the file content
      const blob = await response.blob();
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'resume.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Return the file as a response
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      const data = await response.json();
      return NextResponse.json(
        { error: data.detail || "Failed to download resume" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Resume download error:", error);
    return NextResponse.json(
      { error: error.message || "Error downloading resume" },
      { status: 500 }
    );
  }
}