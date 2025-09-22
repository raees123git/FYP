"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

// Animation Variants
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

export default function ViewProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumePdfUrl, setResumePdfUrl] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);

  const handleResumeView = async (fileId) => {
    try {
      setLoadingResume(true);
      setShowResumeModal(true);
      
      const response = await fetch(`/api/resume/download/${fileId}`);
      
      if (response.ok) {
        // Get the blob from response
        const blob = await response.blob();
        
        // Create a URL for the PDF
        const url = window.URL.createObjectURL(blob);
        setResumePdfUrl(url);
      } else {
        console.error('Failed to load resume');
        setShowResumeModal(false);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
      setShowResumeModal(false);
    } finally {
      setLoadingResume(false);
    }
  };

  const handleCloseModal = () => {
    setShowResumeModal(false);
    if (resumePdfUrl) {
      window.URL.revokeObjectURL(resumePdfUrl);
      setResumePdfUrl(null);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await fetch(`/api/resume/download/${fileId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = profileData?.resume_filename || 'resume.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded || !user) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/profile");
        const data = await response.json();

        if (response.ok) {
          setProfileData(data);
        } else {
          setError(data.error || "Failed to load profile");
        }
      } catch (error) {
        console.error(error);
        setError("Network error. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin"></div>
          <div className="absolute inset-3 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin animate-duration-2000"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600/20 to-purple-600/0 animate-pulse"></div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Loading Profile</h3>
          <p className="text-indigo-400 animate-pulse">Retrieving your skill data...</p>
        </div>
      </div>
    );
  }

  if (!profileData && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeIn}
          className="w-full max-w-xl bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 space-y-6 shadow-xl border border-gray-700/50 text-center"
        >
          <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent pb-1">
            Profile Not Found
          </h2>
          <p className="text-gray-400">You haven't set up your profile yet.</p>
          <Link href="/profile/update">
            <button className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium hover:from-indigo-500 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-indigo-500/25">
              Create Profile
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <motion.div
          className="absolute top-[10%] left-[15%] w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[80px]"
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[40%] right-[15%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[80px]"
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[35%] w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-[80px]"
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>

      <motion.div
        className="w-full max-w-xl bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 space-y-6 shadow-xl border border-gray-700/50 z-10"
        variants={fadeIn}
      >
        <div className="flex justify-between items-center mb-6">
          <motion.h2
            className="text-3xl font-bold text-white bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent pb-1"
            variants={cardVariants}
          >
            Your Profile
          </motion.h2>
          <motion.div variants={cardVariants}>
            <Link href="/profile/update">
              <button className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium hover:from-indigo-500 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-indigo-500/25 hover:scale-105 active:scale-95">
                Update Profile
              </button>
            </Link>
          </motion.div>
        </div>

        {error && (
          <motion.div
            variants={cardVariants}
            className="bg-red-900/50 text-red-200 p-4 rounded-xl text-sm border-l-4 border-red-500"
          >
            <strong>Error:</strong> {error}
          </motion.div>
        )}

        {profileData && (
          <motion.div className="space-y-5" variants={containerVariants}>
            {/* Personal Info */}
            <motion.div variants={cardVariants} className="bg-gray-700/40 p-5 rounded-xl border border-gray-600/30 hover:border-indigo-500/20 transition-all duration-300 hover:translate-y-[-4px]">
              <h3 className="text-lg font-semibold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">First Name</p>
                  <p className="text-white text-lg">{profileData.first_name || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Last Name</p>
                  <p className="text-white text-lg">{profileData.last_name || "Not specified"}</p>
                </div>
              </div>
            </motion.div>

            {/* Professional Details */}
            <motion.div variants={cardVariants} className="bg-gray-700/40 p-5 rounded-xl border border-gray-600/30 hover:border-indigo-500/20 transition-all duration-300 hover:translate-y-[-4px]">
              <h3 className="text-lg font-semibold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Professional Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Industry</p>
                  <p className="text-white text-lg">{profileData.industry || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Position</p>
                  <p className="text-white text-lg">{profileData.position || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Years of Experience</p>
                  <p className="text-white text-lg">{profileData.experience ? `${profileData.experience} years` : "Not specified"}</p>
                </div>
              </div>
            </motion.div>

            {/* Skills */}
            <motion.div variants={cardVariants} className="bg-gray-700/40 p-5 rounded-xl border border-gray-600/30 hover:border-indigo-500/20 transition-all duration-300 hover:translate-y-[-4px]">
              <h3 className="text-lg font-semibold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Skills</h3>
              <motion.div className="flex flex-wrap gap-2" variants={containerVariants}>
                {profileData.skills && profileData.skills.length > 0 ? (
                  profileData.skills.map((skill, index) => (
                    <motion.span
                      key={index}
                      variants={cardVariants}
                      className="bg-indigo-600/30 text-indigo-200 px-3 py-1.5 rounded-lg text-sm border border-indigo-500/20 shadow-sm hover:bg-indigo-600/40 transition-all duration-200 hover:scale-110"
                    >
                      {skill}
                    </motion.span>
                  ))
                ) : (
                  <p className="text-white">No skills specified</p>
                )}
              </motion.div>
            </motion.div>

            {/* Bio */}
            <motion.div variants={cardVariants} className="bg-gray-700/40 p-5 rounded-xl border border-gray-600/30 hover:border-indigo-500/20 transition-all duration-300 hover:translate-y-[-4px]">
              <h3 className="text-lg font-semibold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Professional Bio</h3>
              <p className="text-white whitespace-pre-line leading-relaxed">{profileData.bio}</p>
            </motion.div>

            {/* Resume Section */}
            <motion.div variants={cardVariants} className="bg-gray-700/40 p-5 rounded-xl border border-gray-600/30 hover:border-indigo-500/20 transition-all duration-300 hover:translate-y-[-4px]">
              <h3 className="text-lg font-semibold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Resume</h3>
              {profileData.resume_filename || profileData.resume_file_id ? (
                <div className="space-y-2">
                  <p className="text-green-400 font-medium">✅ Resume uploaded</p>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/50">
                    <p className="text-white text-sm font-medium">{profileData.resume_filename || "Resume.pdf"}</p>
                    {profileData.resume_uploaded_at && (
                      <p className="text-gray-400 text-xs mt-1">
                        Uploaded on {new Date(profileData.resume_uploaded_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {profileData.resume_file_id && (
                      <>
                        <button
                          onClick={() => handleResumeView(profileData.resume_file_id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Resume
                        </button>
                        <button
                          onClick={() => handleDownload(profileData.resume_file_id)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          Download
                        </button>
                      </>
                    )}
                    <Link href="/profile/update">
                      <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
                        Update Resume
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-yellow-400 font-medium">⚠️ No resume uploaded</p>
                  <p className="text-gray-400 text-sm">Upload your resume to enable resume-based interviews and improve your profile completeness.</p>
                  <Link href="/profile/update">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors mt-2">
                      Upload Resume
                    </button>
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Resume Viewer Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-gray-700"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {profileData?.resume_filename || "Resume"}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(profileData.resume_file_id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 p-4 overflow-hidden">
              {loadingResume ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading resume...</p>
                  </div>
                </div>
              ) : resumePdfUrl ? (
                <iframe
                  src={resumePdfUrl}
                  className="w-full h-full rounded-lg border border-gray-700"
                  title="Resume PDF Viewer"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400">Failed to load resume</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
