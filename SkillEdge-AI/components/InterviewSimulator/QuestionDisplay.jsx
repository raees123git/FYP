export default function QuestionDisplay({ currentIndex, question }) {
  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700">
      <h2 className="text-lg sm:text-xl font-bold mb-2">{`Question ${currentIndex + 1}`}</h2>
      <p className="text-base sm:text-lg text-blue-300 min-h-[48px]">{question}</p>
    </div>
  );
}
