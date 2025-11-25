import { motion } from "framer-motion";
import { Info } from "lucide-react";

const InfoTooltip = ({ text, position = "top" }) => (
  <div className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 transform -translate-x-1/2 z-50 px-3 py-2 bg-card text-foreground text-xs rounded-lg shadow-xl border border-border w-48 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
    {text}
    <div className={`absolute ${position === "top" ? "top-full" : "bottom-full"} left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent ${position === "top" ? "border-t-4 border-t-card" : "border-b-4 border-b-card"}`}></div>
  </div>
);

export default function FlippableMetricCard({ 
  icon: Icon, 
  title, 
  value, 
  valueColor = "text-primary",
  description, 
  tooltipText,
  backContent,
  isFlipped,
  onFlip,
  delay = 0.1
}) {
  return (
    <>
      <style jsx>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
      <motion.div
        className="relative bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl border border-indigo-500/20 cursor-pointer h-56 hover:border-primary/50 transition-all"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
        onClick={onFlip}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={`absolute inset-0 w-full h-full transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
          {/* Front Side */}
          <div className="absolute inset-0 w-full h-full p-6 backface-hidden bg-gradient-to-br from-gray-800/50 to-indigo-900/50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Icon className="w-8 h-8 mr-3 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              </div>
              {tooltipText && (
                <div className="relative group" onClick={(e) => e.stopPropagation()}>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                  <InfoTooltip text={tooltipText} />
                </div>
              )}
            </div>
            <p className={`text-2xl font-bold ${valueColor}`}>
              {value}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {description}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-4 italic">Click to see {backContent ? 'recommendations' : 'details'} →</p>
          </div>
          
          {/* Back Side */}
          <div className="absolute inset-0 w-full h-full p-6 rotate-y-180 backface-hidden bg-gradient-to-br from-primary/10 to-card rounded-xl border border-primary/20">
            {backContent}
            <p className="text-xs text-muted-foreground/70 mt-4 italic">Click to flip back →</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}