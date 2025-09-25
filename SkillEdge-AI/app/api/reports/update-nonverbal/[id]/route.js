// import { NextRequest, NextResponse } from 'next/server';
// import { currentUser, getAuth } from '@clerk/nextjs/server';

// export async function PUT(request, { params }) {
//   try {
//     // Get user authentication from Clerk
//     let userId = null;
//     try {
//       const auth = getAuth(request);
//       userId = auth?.userId;
//       if (!userId) {
//         const user = await currentUser();
//         userId = user?.id;
//       }
//     } catch (authError) {
//       console.error('Auth error:', authError.message);
//     }
    
//     if (!userId) {
//       return NextResponse.json(
//         { success: false, error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const { id } = params;
    
//     if (!id) {
//       return NextResponse.json(
//         { success: false, error: 'Interview ID is required' },
//         { status: 400 }
//       );
//     }

//     // Parse the request body
//     const body = await request.json();

//     // Call the Python backend API
//     const backendResponse = await fetch(`http://localhost:8000/api/reports/update-nonverbal/${id}`, {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${userId}`,
//       },
//       body: JSON.stringify(body),
//     });

//     if (!backendResponse.ok) {
//       if (backendResponse.status === 404) {
//         return NextResponse.json(
//           { success: false, error: 'Interview report not found' },
//           { status: 404 }
//         );
//       }
      
//       const errorData = await backendResponse.json();
//       console.error('Backend API error:', errorData);
//       return NextResponse.json(
//         { 
//           success: false, 
//           error: errorData.detail || 'Failed to update non-verbal report' 
//         },
//         { status: backendResponse.status }
//       );
//     }

//     const result = await backendResponse.json();
    
//     return NextResponse.json({
//       success: true,
//       data: result
//     });

//   } catch (error) {
//     console.error('Error in update non-verbal API:', error);
//     return NextResponse.json(
//       { 
//         success: false, 
//         error: 'Internal server error' 
//       },
//       { status: 500 }
//     );
//   }
// }