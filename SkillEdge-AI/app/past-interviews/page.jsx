"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Briefcase, 
  FileText, 
  Clock, 
  ChevronRight,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function PastInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await fetch("/api/reports/recent", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch interviews");
      }

      const data = await response.json();
      setInterviews(data.reports || []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast.error("Failed to load past interviews");
    } finally {
      setLoading(false);
    }
  };

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch = 
      interview.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.interview_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === "all" || interview.interview_type === filterType;

    return matchesSearch && matchesFilter;
  });

  const getInterviewTypeColor = (type) => {
    switch (type) {
      case "technical":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "behavioral":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "resume":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getInterviewTypeIcon = (type) => {
    switch (type) {
      case "technical":
        return "💻";
      case "behavioral":
        return "🗣️";
      case "resume":
        return "📄";
      default:
        return "📝";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 max-w-7xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mt-10 text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            Past Interviews
          </h1>
          <p className="text-gray-400 text-lg">
            Review your interview history and track your progress
          </p>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-col md:flex-row gap-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by role or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Types</option>
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="resume">Resume-Based</option>
            </select>
          </div>
        </motion.div>

        {/* Interviews Grid */}
        {filteredInterviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FileText className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No interviews found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterType !== "all"
                ? "Try adjusting your search or filter"
                : "Start your first interview to see it here"}
            </p>
            {!searchTerm && filterType === "all" && (
              <Link href="/interview-type">
                <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                  Start Interview
                </button>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredInterviews.map((interview, index) => (
              <motion.div
                key={interview._id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push(`/interview-details/${interview._id}`)}
              >
                {/* Interview Type Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getInterviewTypeColor(
                      interview.interview_type
                    )}`}
                  >
                    <span className="text-lg">{getInterviewTypeIcon(interview.interview_type)}</span>
                    {interview.interview_type?.charAt(0).toUpperCase() + 
                     interview.interview_type?.slice(1)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                </div>

                {/* Role */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-white">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-semibold text-lg">{interview.role}</h3>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(interview.created_at)}</span>
                </div>

                {/* Questions Count */}
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{interview.questions?.length || 0} Questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Completed</span>
                  </div>
                </div>

                {/* View Details Text */}
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <p className="text-indigo-400 text-sm group-hover:text-indigo-300 transition-colors">
                    Click to view details and reports →
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}