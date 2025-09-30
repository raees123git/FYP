import { auth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const checkUser = async () => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  try {
    // Check if user exists in MongoDB via backend API
    const response = await fetch(`${API_URL}/api/profile/get/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const loggedInUser = await response.json();
      return {
        ...loggedInUser,
        hasCompletedProfile: !!loggedInUser.industry && !!loggedInUser.skills
      };
    }

    // If user doesn't exist, create them via backend API
    const createResponse = await fetch(`${API_URL}/api/profile/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkUserId: userId,
        name: "New User",
        imageUrl: "",
        email: "",
      }),
    });

    if (createResponse.ok) {
      const newUser = await createResponse.json();
      return {
        ...newUser,
        hasCompletedProfile: false
      };
    }

    return null;
  } catch (error) {
    console.error("Error in checkUser:", error);
    return null;
  }
};