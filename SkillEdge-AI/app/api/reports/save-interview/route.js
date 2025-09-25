import { NextRequest, NextResponse } from 'next/server';
import { currentUser, getAuth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    // Get user authentication from Clerk
    let userId = null;
    try {
      const auth = getAuth(request);
      userId = auth?.userId;
      if (!userId) {
        const user = await currentUser();
        userId = user?.id;
      }
    } catch (authError) {
      console.error('Auth error:', authError.message);
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const {
      interview_type,
      role,
      questions,
      answers,
      verbal_report,
      nonverbal_report,
      overall_report
    } = body;

    // Validate required fields
    if (!interview_type || !role || !questions || !answers) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare data for backend API
    const reportData = {
      interview_type,
      role,
      questions,
      answers,
      verbal_report: verbal_report || null,
      nonverbal_report: nonverbal_report || null,
      overall_report: overall_report || null
    };

    // Debug: Log what's being sent to Python backend
    console.log('🐍 SENDING TO PYTHON BACKEND:', {
      interview_type,
      role,
      questionsCount: questions?.length || 0,
      answersCount: answers?.length || 0,
      hasVerbalReport: !!verbal_report,
      hasNonverbalReport: !!nonverbal_report,
      hasOverallReport: !!overall_report
    });
    
    if (nonverbal_report) {
      console.log('🎤 NON-VERBAL REPORT being sent to backend:', {
        hasAnalytics: !!nonverbal_report.analytics,
        hasAudioMetrics: !!nonverbal_report.audioMetrics,
        hasPitchProfile: !!nonverbal_report.pitchProfile,
        hasVoiceQuality: !!nonverbal_report.voiceQuality,
        audioMetricsPreview: nonverbal_report.audioMetrics ? {
          pitch: nonverbal_report.audioMetrics.pitch?.average + 'Hz',
          emotion: nonverbal_report.audioMetrics.tone?.predominantEmotion,
          voiceQuality: nonverbal_report.audioMetrics.voiceQuality?.overall
        } : 'No audio metrics',
        dataSize: JSON.stringify(nonverbal_report).length + ' characters'
      });
    }

    // Call the Python backend API
    const backendResponse = await fetch('http://localhost:8000/api/reports/save-interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}`,
      },
      body: JSON.stringify(reportData),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('Backend API error:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.detail || 'Failed to save interview report' 
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    
    console.log('✅ PYTHON BACKEND RESPONSE:', {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      data: result.data,
      success: result.success
    });
    
    return NextResponse.json({
      success: true,
      message: 'Interview report saved successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error in save-interview API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}