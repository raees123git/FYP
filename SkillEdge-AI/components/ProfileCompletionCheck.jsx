"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export default function ProfileCompletionCheck({ children }) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profileChecked, setProfileChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      // Skip check if auth is still loading
      if (authLoading) return;
      
      // Skip check if no user is signed in
      if (!isAuthenticated) {
        setLoading(false);
        setProfileChecked(true);
        return;
      }

      // Skip check for pages that don't require profile
      const exemptPaths = [
        '/profile/update', 
        '/sign-in', 
        '/sign-up', 
        '/',
        '/interview-type',  // Interview type selection doesn't need profile
        '/interview-simulator'  // Interview simulator handles its own checks
      ];
      
      // Also skip if path starts with these patterns
      const exemptPatterns = [
        '/api/',
        '/interview'
      ];
      
      const isExempt = exemptPaths.includes(pathname) || 
                       exemptPatterns.some(pattern => pathname.startsWith(pattern));
      
      if (isExempt) {
        setLoading(false);
        setProfileChecked(true);
        return;
      }

      try {
        // Check if profile exists and is complete
        const response = await fetch('/api/profile');
        const data = await response.json();

        if (response.status === 404 || !data.first_name || !data.last_name) {
          // Profile doesn't exist or is incomplete
          toast.info("Please complete your profile to continue");
          router.push('/profile/update');
        } else {
          // Profile exists and is complete
          setProfileChecked(true);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        // On error, allow access but log the issue
        setProfileChecked(true);
      } finally {
        setLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user, authLoading, router, pathname, isAuthenticated]);

  // Show loading state
  if (loading || !profileChecked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking profile...</p>
        </div>
      </div>
    );
  }

  return children;
}