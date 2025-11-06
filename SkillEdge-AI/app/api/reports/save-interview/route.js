import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    // Timing: seconds since function start
    const startMs = Date.now();
    const ts = () => ((Date.now() - startMs) / 1000).toFixed(3);
    const log = (msg, extra = {}) => console.log(`[save-interview] ${msg}`, { t: `${ts()}s`, ...extra });

    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    log('after getToken', { hasToken: !!token });
    
    if (!token) {
      log('unauthorized (no token) - returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    log('parsed request body');
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
    log('before backend fetch');
    const backendResponse = await fetch('http://127.0.0.1:8000/api/reports/save-interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reportData),
    });
    log('after backend fetch', { status: backendResponse.status, statusText: backendResponse.statusText });

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
    log('parsed backend response');
    
    console.log('✅ PYTHON BACKEND RESPONSE:', {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      data: result.data,
      success: result.success,
      t: `${ts()}s`
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