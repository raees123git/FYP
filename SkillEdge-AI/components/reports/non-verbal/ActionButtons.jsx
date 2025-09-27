import { motion } from "framer-motion";
import { Download, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateReportContent } from "./utils";

export default function ActionButtons({ analytics, audioMetrics }) {
  const router = useRouter();

  const downloadReport = () => {
    const reportContent = generateReportContent(analytics, audioMetrics);
    
    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `non-verbal-report-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <button
        onClick={downloadReport}
        className="flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg transition-transform hover:scale-105"
      >
        <Download className="w-5 h-5 mr-2" />
        Download Report
      </button>
      
      <button
        onClick={() => router.push("/interview/complete")}
        className="flex items-center px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-lg transition-transform hover:scale-105"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Results
      </button>
    </motion.div>
  );
}