import { motion } from "framer-motion";
import Image from "next/image";

export default function AvatarSection({ videoRef }) {
  return (
    <motion.div className="w-full sm:w-1/3 flex flex-col items-center gap-4 sm:gap-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 border-blue-500 overflow-hidden relative group bg-gray-900">
        <Image src="/avatar.jpg" alt="Avatar" fill className="object-cover rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <video ref={videoRef} autoPlay playsInline className="w-full sm:w-64 h-36 sm:h-48 rounded-xl border border-gray-600 object-cover scale-x-[-1] transition-transform duration-300" />
    </motion.div>
  );
}
