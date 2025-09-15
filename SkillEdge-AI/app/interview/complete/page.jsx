"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function InterviewComplete() {
  const [data, setData] = useState({ questions: [], answers: [] });
  const [showWordCount, setShowWordCount] = useState(false);
  const [wordFrequency, setWordFrequency] = useState({});
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("interviewResults");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setData(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to parse interviewResults:", e);
      router.replace("/");
    }
  }, [router]);

  const { questions, answers } = data;

  // Function to calculate word frequency from all answers
  const calculateWordFrequency = () => {
    const allText = answers.join(" ");
    const words = allText.split(/\s+/);
    const frequency = {};
    
    words.forEach(word => {
      if (word) { // Skip empty strings
        const cleanWord = word.toLowerCase();
        frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
      }
    });
    
    // Sort by frequency (descending)
    const sortedFrequency = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [word, count]) => {
        acc[word] = count;
        return acc;
      }, {});
    
    setWordFrequency(sortedFrequency);
    setShowWordCount(true);
  };

  return (
    <div
  className="absolute top-24 left-0 w-full bg-gray-950 text-white min-h-screen p-8"
>
  <motion.h1
    className="text-4xl font-bold mb-8 text-center"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    Your Interview Review
  </motion.h1>

  {/* center everything and constrain width */}
  <div className="max-w-4xl mx-auto space-y-6">
    {questions.map((q, i) => (
      <motion.div
        key={i}
        className="bg-gray-800 p-6 rounded-xl border border-gray-700"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
      >
        <h2 className="text-xl font-semibold mb-2 text-blue-300">
          {`Question ${i + 1}`}
        </h2>
        <p className="mb-4">{q}</p>
        <h3 className="text-lg font-semibold mb-1 text-blue-300">Your Answer:</h3>
        <p className="whitespace-pre-wrap">{answers[i]}</p>
      </motion.div>
    ))}
  </div>

  {/* Report Buttons Section */}
  <div className="max-w-4xl mx-auto mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700">
    <h2 className="text-2xl font-bold mb-4 text-center text-blue-300">
      Interview Analysis Reports
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <button
        onClick={() => alert("Verbal Report - Coming Soon!")}
        disabled={true}
        className="px-6 py-3 bg-gray-600 text-gray-400 rounded-xl shadow-lg cursor-not-allowed opacity-50"
      >
        Verbal Report
      </button>
      <button
        onClick={() => {
          // Store the current interview data for the non-verbal report
          const reportData = {
            questions,
            answers,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem("interviewReportData", JSON.stringify(reportData));
          router.push("/interview/reports/non-verbal");
        }}
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg transition-transform hover:scale-105"
      >
        Non-Verbal Report
      </button>
      <button
        onClick={() => alert("Combined Report - Coming Soon!")}
        disabled={true}
        className="px-6 py-3 bg-gray-600 text-gray-400 rounded-xl shadow-lg cursor-not-allowed opacity-50"
      >
        Combined Report
      </button>
    </div>
  </div>

  {/* Word Frequency Button */}
  <div className="flex justify-center mt-8">
    <button
      onClick={calculateWordFrequency}
      className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-xl shadow-lg transition-transform hover:scale-105"
    >
      {showWordCount ? "Refresh Word Count" : "Show Word Count"}
    </button>
  </div>

  {/* Word Frequency Display */}
  {showWordCount && (
    <motion.div
      className="max-w-4xl mx-auto mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-300">
        Word Frequency Analysis
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
        {Object.entries(wordFrequency).map(([word, count], index) => (
          <motion.div
            key={index}
            className="bg-gray-700 p-2 rounded-lg text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.01 }}
          >
            <span className="text-sm text-gray-300 break-all">{word}</span>
            <span className="block text-lg font-semibold text-blue-400">{count}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 text-center text-gray-400">
        Total unique words: {Object.keys(wordFrequency).length}
      </div>
    </motion.div>
  )}

  <div className="flex justify-center mt-8">
    <button
      onClick={() => {
        localStorage.removeItem("interviewResults");
        router.push("/");
      }}
      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-transform hover:scale-105"
    >
      Back to Home
    </button>
  </div>
</div>

  );
}
