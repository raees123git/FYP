"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function InterviewTypeSelector() {
  const { user } = useUser();
  const [selectedType, setSelectedType] = useState("technical");
  const [selectedRole, setSelectedRole] = useState("Software Engineer");
  const [isLoaded, setIsLoaded] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingResume, setExistingResume] = useState(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumePdfUrl, setResumePdfUrl] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customQuestionCount, setCustomQuestionCount] = useState("");

  const interviewTypes = [
    {
      id: "technical",
      name: "Technical",
      description: "Coding, algorithms, and system design questions.",
      bg: "bg-blue-600",
      hover: "hover:bg-blue-700",
      ring: "ring-blue-400",
      accent: "text-blue-400",
    },
    {
      id: "behavioral",
      name: "Behavioral",
      description: "STAR method, soft skills, and communication.",
      bg: "bg-green-600",
      hover: "hover:bg-green-700",
      ring: "ring-green-400",
      accent: "text-green-400",
    },
    {
      id: "resume",
      name: "Resume-Based",
      description: "Get personalized questions based on your resume content.",
      bg: "bg-purple-600",
      hover: "hover:bg-purple-700",
      ring: "ring-purple-400",
      accent: "text-purple-400",
    },
  ];

  const technicalRoles = [
    "Software Engineer",
    "ML Engineer",
    "Web Developer",
    "Mobile Developer",
  ];

  // Only check for resume when resume-based interview is selected
  useEffect(() => {
    const checkUserResume = async () => {
      // Only fetch resume if resume-based interview is selected
      if (selectedType === "resume" && user) {
        try {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const profileData = await response.json();
            if (profileData.resume_file_id) {
              setExistingResume({
                file_id: profileData.resume_file_id,
                filename: profileData.resume_filename || 'Resume.pdf',
                uploaded_at: profileData.resume_uploaded_at
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    checkUserResume();
  }, [user, selectedType]); // Re-run when selectedType changes

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      toast.error("Please select a resume file");
      return;
    }

    if (resumeFile.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    window.location.href = `/interview-simulator?type=resume&count=${questionCount}`;
  };

  const handleViewResume = async () => {
    if (!existingResume) return;
    
    setLoadingResume(true);
    setShowResumeModal(true);
    
    try {
      const response = await fetch(`/api/resume/download/${existingResume.file_id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setResumePdfUrl(url);
      } else {
        toast.error('Failed to load resume');
        setShowResumeModal(false);
      }
    } catch (error) {
      console.error('Error loading resume:', error);
      toast.error('Error loading resume');
      setShowResumeModal(false);
    } finally {
      setLoadingResume(false);
    }
  };

  const handleCloseModal = () => {
    setShowResumeModal(false);
    if (resumePdfUrl) {
      URL.revokeObjectURL(resumePdfUrl);
      setResumePdfUrl(null);
    }
  };

  const handleContinue = () => {
    if (selectedType === "resume") {
      if (existingResume) {
        // If resume exists, pass the file_id to the interview simulator
        window.location.href = `/interview-simulator?type=resume&count=${questionCount}&resume_id=${existingResume.file_id}`;
      } else {
        // If no resume exists, handle new upload
        handleResumeUpload();
      }
      return;
    }

    let url;
    if (selectedType === "technical") {
      url = `/interview-simulator?type=technical&role=${encodeURIComponent(selectedRole)}&count=${questionCount}`;
    } else {
      url = `/interview-simulator?type=behavioral&count=${questionCount}`;
    }

    window.location.href = url;
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-white flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"
        }`}
    >
      <div className="w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[1200px] mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-8 sm:mb-14 text-center bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text animate-pulse">
          Select Interview Type
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-10 w-full mb-8 sm:mb-10">
          {interviewTypes.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`cursor-pointer transform transition-all duration-500 hover:scale-105 backdrop-blur-md bg-gray-800/70 border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl ${isSelected
                  ? `border-transparent ring-2 sm:ring-4 ${type.ring}`
                  : "border-gray-700 hover:border-gray-500"
                  }`}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${type.accent}`}>
                    {type.name}
                  </h2>
                  {isSelected && (
                    <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium ${type.bg}`}>
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed">
                  {type.description}
                </p>
              </div>
            );
          })}
        </div>


        {/* Question Count Selector - Show for all interview types */}
        <div className="mb-6 sm:mb-8 text-center">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-300">
            Select Number of Questions:
          </h3>
          <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
            {[3, 5, 7, 10].map((count) => (
              <button
                key={count}
                onClick={() => {
                  setQuestionCount(count);
                  setShowCustomInput(false);
                  setCustomQuestionCount("");
                }}
                className={`px-4 sm:px-5 py-2 rounded-lg transition-all duration-200 border text-sm sm:text-base font-medium ${
                  questionCount === count && !showCustomInput
                    ? selectedType === "technical"
                      ? "bg-blue-600 text-white border-blue-500"
                      : selectedType === "behavioral"
                      ? "bg-green-600 text-white border-green-500"
                      : "bg-purple-600 text-white border-purple-500"
                    : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                }`}
              >
                {count}
              </button>
            ))}
            
            {/* Custom input option */}
            {!showCustomInput ? (
              <button
                onClick={() => {
                  setShowCustomInput(true);
                  setCustomQuestionCount(questionCount.toString());
                }}
                className="px-4 sm:px-5 py-2 rounded-lg transition-all duration-200 border text-sm sm:text-base font-medium bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                Custom
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={customQuestionCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomQuestionCount(value);
                    if (value && parseInt(value) > 0 && parseInt(value) <= 20) {
                      setQuestionCount(parseInt(value));
                    }
                  }}
                  placeholder="1-20"
                  className="w-20 px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm sm:text-base"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (customQuestionCount && parseInt(customQuestionCount) > 0 && parseInt(customQuestionCount) <= 20) {
                      setQuestionCount(parseInt(customQuestionCount));
                      toast.success(`Set to ${customQuestionCount} questions`);
                    } else {
                      toast.error("Please enter a number between 1 and 20");
                      setShowCustomInput(false);
                      setCustomQuestionCount("");
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomQuestionCount("");
                    setQuestionCount(5); // Reset to default
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm transition-colors"
                >
                  ✗
                </button>
              </div>
            )}
          </div>
          {showCustomInput && (
            <p className="text-xs text-gray-400 mt-2">Enter a number between 1 and 20</p>
          )}
        </div>

        {/* Sub-options for Technical roles */}
        {selectedType === "technical" && (
          <div className="mb-8 sm:mb-10 text-center">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 text-blue-300">
              Select a Technical Role:
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
              {technicalRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 border text-sm sm:text-base ${selectedRole === role
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Upload option for Resume-Based */}
        {selectedType === "resume" && (
          <div className="mb-8 sm:mb-10 text-center space-y-4 sm:space-y-6">
            {existingResume ? (
              <div className="max-w-[95%] sm:max-w-md mx-auto">
                <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-purple-300">
                    Resume Fetched Successfully!
                  </h3>
                  <p className="text-sm text-gray-300">
                    Your resume has been automatically fetched from your profile.
                  </p>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/50">
                    <p className="text-white text-sm font-medium">{existingResume.filename}</p>
                    {existingResume.uploaded_at && (
                      <p className="text-gray-400 text-xs mt-1">
                        Uploaded on {new Date(existingResume.uploaded_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleViewResume}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Click to View Your Resume
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="max-w-[95%] sm:max-w-md mx-auto">
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 text-purple-300">
                    Upload Your Resume:
                  </h3>
                  <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="block w-full text-xs sm:text-sm text-gray-300
                        file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4
                        file:rounded-lg file:border-0
                        file:text-xs sm:file:text-sm file:font-semibold
                        file:bg-purple-600 file:text-white
                        hover:file:bg-purple-700
                        cursor-pointer"
                    />
                    <p className="text-xs sm:text-sm text-gray-400">
                      Only PDF files are accepted
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={isUploading || (selectedType === "resume" && !existingResume && !resumeFile)}
            className={`px-6 sm:px-8 py-2 sm:py-3 rounded-xl text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm sm:text-base ${selectedType === "resume" && !existingResume && !resumeFile
              ? "bg-gray-600 cursor-not-allowed"
              : selectedType === "resume"
                ? "bg-purple-600 hover:bg-purple-700"
                : selectedType === "technical"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>

      {/* Resume Viewer Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-gray-700">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {existingResume?.filename || "Resume"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 p-4 overflow-hidden">
              {loadingResume ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
          </div>
        </div>
      )}
    </div>
  );
}
