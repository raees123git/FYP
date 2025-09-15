import { motion } from "framer-motion";

export default function ReportHeader() {
  return (
    <motion.div
      className="text-center mb-10"
      initial={{ y: -20 }}
      animate={{ y: 0 }}
    >
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Non-Verbal Communication Report
      </h1>
      <p className="text-muted-foreground">Detailed analysis of your speech patterns and delivery</p>
    </motion.div>
  );
}