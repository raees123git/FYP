import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Fallback data in case AI fails
const fallbackData = {
  marketOutlook: "Positive",
  growthRate: 8.5,
  demandLevel: "Medium",
  topSkills: ["Communication", "Problem Solving", "Adaptability", "Technical Skills"],
  recommendedSkills: ["Data Analysis", "Project Management", "Digital Marketing"],
  salaryRanges: [
    { role: "Junior Level", min: 45000, median: 55000, max: 70000 },
    { role: "Mid Level", min: 65000, median: 80000, max: 100000 },
    { role: "Senior Level", min: 90000, median: 115000, max: 145000 }
  ],
  keyTrends: [
    "Digital transformation accelerating across industries",
    "Remote work becoming standard practice",
    "Emphasis on continuous learning and upskilling"
  ],
  lastUpdated: new Date().toISOString(),
  nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

async function generateInsightsWithAI(userProfile) {
  try {
    // Debug API key
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    console.log("API key length:", process.env.GEMINI_API_KEY?.length);
    
    const { industry, skills, position, experience } = userProfile;
    const skillsString = Array.isArray(skills) ? skills.join(", ") : skills;

    const prompt = `Generate comprehensive industry insights for a professional with the following profile:
- Position: ${position}
- Industry: ${industry}
- Skills: ${skillsString}
- Experience: ${experience} years

Please provide a detailed analysis in the following JSON format (respond with ONLY valid JSON, no additional text):

{
  "marketOutlook": "Positive/Neutral/Negative",
  "growthRate": [number between 0-20],
  "demandLevel": "High/Medium/Low",
  "topSkills": [array of 8 most in-demand skills for this industry/position],
  "recommendedSkills": [array of 6 skills the person should learn based on their current skills],
  "salaryRanges": [
    {"role": "Junior ${position}", "min": [salary], "median": [salary], "max": [salary]},
    {"role": "Mid-Level ${position}", "min": [salary], "median": [salary], "max": [salary]},
    {"role": "Senior ${position}", "min": [salary], "median": [salary], "max": [salary]},
    {"role": "Lead ${position}", "min": [salary], "median": [salary], "max": [salary]}
  ],
  "keyTrends": [array of 5 current industry trends relevant to this position],
  "industryAnalysis": "A detailed paragraph analyzing the current state and future prospects of this industry for someone in this position"
}

Make sure all salary figures are realistic USD amounts for the current market (2024), growth rate is a percentage, and all arrays contain the exact number of items specified. Base recommendations on current market demand and emerging technologies in the ${industry} industry.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean the response and parse JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const aiInsights = JSON.parse(cleanedText);

    // Add timestamps
    aiInsights.lastUpdated = new Date().toISOString();
    aiInsights.nextUpdate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    aiInsights.industry = industry;
    aiInsights.position = position;

    // Validate the response structure
    if (!aiInsights.marketOutlook || !aiInsights.growthRate || !aiInsights.salaryRanges) {
      throw new Error("Invalid AI response structure");
    }

    return aiInsights;
  } catch (error) {
    console.error("Error generating AI insights:", error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await request.json();

    // Validate required fields
    if (!userProfile.industry || !userProfile.skills || !userProfile.position) {
      return NextResponse.json(
        { error: "Missing required profile data: industry, skills, and position are required" },
        { status: 400 }
      );
    }

    console.log("Generating AI insights for:", userProfile);

    try {
      // Try to generate insights with AI first
      const insights = await generateInsightsWithAI(userProfile);
      console.log("AI insights generated successfully");
      return NextResponse.json(insights);
    } catch (aiError) {
      console.error("AI generation failed, using fallback:", aiError);
      
      // If AI fails, return enhanced fallback data
      const enhancedFallback = {
        ...fallbackData,
        industry: userProfile.industry,
        position: userProfile.position,
        industryAnalysis: `As a ${userProfile.position} in the ${userProfile.industry} industry with ${userProfile.experience || 0} years of experience, you're positioned in a dynamic field with various opportunities for growth. The current market conditions offer potential for career advancement, especially for professionals who stay current with industry trends and continue developing their skills. Your expertise in ${Array.isArray(userProfile.skills) ? userProfile.skills.join(", ") : userProfile.skills} provides a strong foundation for continued success in this evolving landscape.`
      };

      return NextResponse.json(enhancedFallback);
    }
  } catch (error) {
    console.error("Error in industry insights API:", error);
    return NextResponse.json(
      { error: "Failed to generate industry insights" },
      { status: 500 }
    );
  }
}