"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function UpdateProfilePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    skills: "",
    industry: "",
    position: "",
    experience: "",
    bio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [existingResume, setExistingResume] = useState(null);

  // Fetch user data from MongoDB via API route
  useEffect(() => {
    const fetchUserData = async () => {
      if (authLoading || !isAuthenticated) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/profile");
        const data = await response.json();

        if (response.ok) {
          setFormData({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
            industry: data.industry || "",
            position: data.position || "",
            experience: data.experience?.toString() || "",
            bio: data.bio || "",
          });
          // Check if user has uploaded a resume
          if (data.resume_filename) {
            setExistingResume({
              filename: data.resume_filename,
              file_id: data.resume_file_id,
              uploaded_at: data.resume_uploaded_at
            });
          }
        } else if (response.status === 404) {
          // If profile not found, this is a first-time user
          setIsFirstTime(true);
          // Pre-fill with Clerk user data
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            // Keep other fields empty
          }));
        } else {
          // Handle other errors
          setError(data.error || "Failed to load profile");
          toast.error(data.error || "Failed to load profile data");
        }
      } catch (error) {
        console.error(error);
        setError("Network error. Please try again later.");
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authLoading, isAuthenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields for first-time users
    if (isFirstTime) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error("Please fill in your first and last name");
        return;
      }
      if (!formData.industry || !formData.position) {
        toast.error("Please select your industry and position");
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Format data for Supabase
      const dataToSubmit = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        skills: formData.skills.split(",").map(skill => skill.trim()).filter(Boolean),
        industry: formData.industry,
        experience: parseInt(formData.experience) || 0,
        bio: formData.bio,
        position: formData.position,
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      const data = await response.json();

      if (response.ok) {
        if (isFirstTime) {
          toast.success("Profile created successfully! Welcome to SkillEdge!");
          router.push("/"); // First-time users go to home page
        } else {
          toast.success("Profile updated successfully");
          router.push("/profile"); // Existing users go to profile view
        }
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error) {
      const errorMessage = error.message || "Error updating profile";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!resumeFile.type.includes('pdf')) {
      toast.error("Please upload a PDF file");
      return;
    }

    if (resumeFile.size > 10 * 1024 * 1024) {
      toast.error("File size should not exceed 10MB");
      return;
    }

    setIsUploadingResume(true);

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Resume uploaded successfully!");
        setExistingResume({
          filename: data.filename,
          file_id: data.file_id,
          uploaded_at: new Date().toISOString()
        });
        setResumeFile(null);
      } else {
        throw new Error(data.error || "Failed to upload resume");
      }
    } catch (error) {
      toast.error(error.message || "Error uploading resume");
      console.error("Resume upload error:", error);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleResumeDelete = async () => {
    if (!existingResume?.file_id) return;

    if (!confirm("Are you sure you want to delete your resume?")) return;

    try {
      const response = await fetch(`/api/resume/delete/${existingResume.file_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Resume deleted successfully");
        setExistingResume(null);
      } else {
        throw new Error("Failed to delete resume");
      }
    } catch (error) {
      toast.error("Error deleting resume");
      console.error("Resume delete error:", error);
    }
  };

  // Display loading UI
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin"></div>
          <div className="absolute inset-3 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin animate-duration-2000"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600/20 to-purple-600/0 animate-pulse"></div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Loading Profile</h3>
          <p className="text-indigo-400 animate-pulse">Preparing your skill dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 space-y-6 shadow-xl border border-gray-700/50 transition-all duration-300 hover:shadow-indigo-500/10"
      >
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent pb-1">
            {isFirstTime ? "Complete Your Profile" : "Update Your Profile"}
          </h2>
          <p className="text-gray-400">
            {isFirstTime 
              ? "Tell us about yourself to get started with SkillEdge" 
              : "Customize your professional profile on SkillEdge"}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 text-red-200 p-4 rounded-xl text-sm border-l-4 border-red-500 animate-pulse">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-gray-200 mb-1.5 font-medium">
              First Name {isFirstTime && <span className="text-red-400">*</span>}
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required={isFirstTime}
              className="w-full rounded-lg bg-gray-700/70 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 border border-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-200 mb-1.5 font-medium">
              Last Name {isFirstTime && <span className="text-red-400">*</span>}
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required={isFirstTime}
              className="w-full rounded-lg bg-gray-700/70 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 border border-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-200 mb-1.5 font-medium">Skills (comma separated)</label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="e.g., JavaScript, React, Node.js"
            className="w-full rounded-lg bg-gray-700/70 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 border border-gray-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-gray-200 mb-1.5 font-medium">
              Industry {isFirstTime && <span className="text-red-400">*</span>}
            </label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              required={isFirstTime}
              className="w-full rounded-lg bg-gray-700/70 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 border border-gray-600 appearance-none"
            >
              <option value="">Select</option>
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Marketing">Marketing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-200 mb-1.5 font-medium">
              Position {isFirstTime && <span className="text-red-400">*</span>}
            </label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              required={isFirstTime}
              className="w-full rounded-lg bg-gray-700/70 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 border border-gray-600 appearance-none"
            >
              <option value="">Select</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="ML Engineer">ML Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-gray-200 mb-1.5 font-medium">Years of Experience</label>
          <input
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            min="0"
            placeholder="e.g., 3"
            className="w-full rounded-lg bg-gray-700/70 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 border border-gray-600"
          />
        </div>

        <div>
          <label className="block text-gray-200 mb-1.5 font-medium">Professional Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="4"
            placeholder="Tell us about your professional background..."
            className="w-full rounded-lg bg-gray-700/70 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 border border-gray-600 resize-none"
          />
        </div>

        <div>
          <label className="block text-gray-200 mb-1.5 font-medium">Resume (PDF)</label>
          {existingResume ? (
            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{existingResume.filename}</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Uploaded on {new Date(existingResume.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResumeDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg bg-gray-700/70 text-white p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 border border-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
              {resumeFile && (
                <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                  <span className="text-gray-300 text-sm">{resumeFile.name}</span>
                  <button
                    type="button"
                    onClick={handleResumeUpload}
                    disabled={isUploadingResume}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                  >
                    {isUploadingResume ? "Uploading..." : "Upload"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 transition-all duration-300 shadow-md hover:shadow-indigo-500/25"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          ) : "Update Profile"}
        </button>
      </form>
    </div>
  );
}




