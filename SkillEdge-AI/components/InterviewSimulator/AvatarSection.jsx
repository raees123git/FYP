import { motion } from "framer-motion";
import TalkingAvatar from "./TalkingAvatar";

export default function AvatarSection({ videoRef, isSpeaking }) {
  return (
    <motion.div 
      className="w-full sm:w-1/3 flex flex-col items-center gap-4 sm:gap-6" 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
    >
      <TalkingAvatar isSpeaking={isSpeaking} />
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full sm:w-64 h-36 sm:h-48 rounded-xl border border-border object-cover scale-x-[-1] transition-transform duration-300" 
      />
    </motion.div>
  );
}
