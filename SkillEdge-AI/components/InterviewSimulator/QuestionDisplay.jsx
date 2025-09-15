export default function QuestionDisplay({ currentIndex, question }) {
  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl border border-border">
      <h2 className="text-lg sm:text-xl font-bold mb-2 text-primary">{`Question ${currentIndex + 1}`}</h2>
      <p className="text-base sm:text-lg text-foreground min-h-[48px]">{question}</p>
    </div>
  );
}
