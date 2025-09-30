"use client";

import { motion } from "framer-motion";

// Progress Circle Component for Scores
export const ProgressCircle = ({ score, size = "lg", color = "blue", label }) => {
  // Validate and sanitize the score prop
  const validScore = isNaN(score) || score === null || score === undefined ? 0 : Number(score);
  const clampedScore = Math.max(0, Math.min(100, validScore));
  
  const radius = size === "sm" ? 30 : size === "lg" ? 45 : 35;
  const strokeWidth = size === "sm" ? 4 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
  
  const colors = {
    blue: "stroke-blue-500",
    green: "stroke-green-500",
    purple: "stroke-purple-500",
    orange: "stroke-orange-500",
    red: "stroke-red-500"
  };

  const containerSize = size === "sm" ? "w-20 h-20" : size === "lg" ? "w-32 h-32" : "w-24 h-24";
  const fontSize = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className={`relative ${containerSize} flex items-center justify-center`}>
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={colors[color]}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold text-white ${fontSize}`}>{Math.round(clampedScore)}</span>
        {label && <span className="text-xs text-gray-400 mt-1">{label}</span>}
      </div>
    </div>
  );
};

// Metric Card Component
export const MetricCard = ({ title, value, icon: Icon, color = "blue", subtitle }) => {
  const colors = {
    blue: "border-blue-500/30 bg-blue-500/10",
    green: "border-green-500/30 bg-green-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    orange: "border-orange-500/30 bg-orange-500/10",
    red: "border-red-500/30 bg-red-500/10"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border ${colors[color]} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className={`w-5 h-5 text-${color}-400`} />}
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      </div>
      <div className="text-xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </motion.div>
  );
};

// Progress Bar Component
export const ProgressBar = ({ value, max = 100, color = "blue", label, showPercentage = true }) => {
  // Validate and sanitize the value prop
  const validValue = isNaN(value) || value === null || value === undefined ? 0 : Number(value);
  const validMax = isNaN(max) || max === null || max === undefined || max <= 0 ? 100 : Number(max);
  const percentage = Math.round((validValue / validMax) * 100);
  
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    red: "bg-red-500"
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        {showPercentage && <span className="text-sm text-gray-400">{percentage}%</span>}
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${colors[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

// Section Card Component
export const SectionCard = ({ title, children, icon: Icon, color = "blue" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        {Icon && <Icon className={`w-6 h-6 text-${color}-400`} />}
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
};

// Status Badge Component
export const StatusBadge = ({ status, size = "md" }) => {
  // Handle undefined or null status values
  if (!status || typeof status !== 'string') {
    return (
      <span className={`inline-flex items-center rounded-full border font-medium bg-gray-500/20 text-gray-400 border-gray-500/30 px-3 py-1 text-sm`}>
        N/A
      </span>
    );
  }

  const getStatusColor = (status) => {
    const lower = status.toLowerCase();
    if (lower.includes('excellent') || lower.includes('outstanding')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (lower.includes('good') || lower.includes('strong')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (lower.includes('average') || lower.includes('moderate')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (lower.includes('poor') || lower.includes('weak')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${getStatusColor(status)} ${sizeClasses[size]}`}>
      {status}
    </span>
  );
};

// List Item Component
export const ListItem = ({ children, color = "blue", icon: Icon }) => {
  const colors = {
    blue: "text-blue-400",
    green: "text-green-400", 
    purple: "text-purple-400",
    orange: "text-orange-400",
    red: "text-red-400"
  };

  return (
    <motion.li 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg bg-gray-700/20 border border-gray-600/30"
    >
      {Icon ? <Icon className={`w-4 h-4 mt-0.5 ${colors[color]}`} /> : <span className={`w-2 h-2 rounded-full ${colors[color].replace('text-', 'bg-')} mt-2 flex-shrink-0`} />}
      <span className="text-gray-300 leading-relaxed">{children}</span>
    </motion.li>
  );
};