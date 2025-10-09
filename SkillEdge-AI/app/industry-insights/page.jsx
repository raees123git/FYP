"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import DashboardView from "@/components/industry-insights/DashboardView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function IndustryInsightsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    fetchUserProfileAndInsights();
  }, [isLoaded, user, router]);

  const fetchUserProfileAndInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const profileResponse = await fetch("/api/profile");
      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        if (profileResponse.status === 404) {
          setError("profile_incomplete");
          return;
        }
        throw new Error(profileData.error || "Failed to fetch profile");
      }

      // Check if profile is complete
      if (!profileData.industry || !profileData.skills || !profileData.position) {
        setError("profile_incomplete");
        return;
      }

      setUserProfile(profileData);

      // Generate industry insights based on profile
      const insightsResponse = await fetch("/api/industry-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          industry: profileData.industry,
          skills: Array.isArray(profileData.skills) ? profileData.skills : profileData.skills.split(",").map(s => s.trim()),
          position: profileData.position,
          experience: profileData.experience || 0,
        }),
      });

      const insightsData = await insightsResponse.json();

      if (!insightsResponse.ok) {
        throw new Error(insightsData.error || "Failed to fetch industry insights");
      }

      setInsights(insightsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("fetch_error");
      toast.error("Failed to load industry insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading industry insights...</p>
        </div>
      </div>
    );
  }

  if (error === "profile_incomplete") {
    return (
      <div className="min-h-screen pt-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <Card>
              <CardHeader>
                <div className="flex justify-center">
                  <AlertCircle className="h-12 w-12 text-yellow-500" />
                </div>
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>
                  To view personalized industry insights, you need to complete your profile with your skills, industry, and position.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Industry insights are tailored based on your:
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Industry sector</li>
                  <li>• Skills and expertise</li>
                  <li>• Current position level</li>
                  <li>• Years of experience</li>
                </ul>
                <div className="pt-4">
                  <Button asChild className="w-full">
                    <Link href="/profile/update">
                      Complete Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error === "fetch_error") {
    return (
      <div className="min-h-screen pt-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <Card>
              <CardHeader>
                <div className="flex justify-center">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <CardTitle>Error Loading Insights</CardTitle>
                <CardDescription>
                  There was an error loading your industry insights. Please try again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={fetchUserProfileAndInsights} className="w-full">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Industry Insights</h1>
              <p className="text-muted-foreground">
                Personalized market data and trends for {userProfile?.industry} professionals
              </p>
            </div>
            
            {/* Position Badge */}
            <div className="flex justify-center">
              <div className="bg-primary/10 border border-primary/20 rounded-full px-6 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-lg font-semibold text-primary">
                    {userProfile?.position}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {insights && <DashboardView insights={insights} />}
        </motion.div>
      </div>
    </div>
  );
}