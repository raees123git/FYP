import { XCircle } from "lucide-react";

export default function AnswerSection({
  answer,
  setAnswer,
  setSpoken,
  transcribing,
  timeLeft,
  formatTime,
  startListening,
  stopListening,
  handleSubmit,
  canStart,
  canStop,
  canSubmit,
  startLabel,
  submitLabel,
  hoveredButton,
  setHoveredButton
}) {
  const btnClass = (enabled) =>
    `${enabled ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 cursor-not-allowed"} px-6 py-2 rounded-lg text-white flex items-center`;

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-lg sm:text-xl font-bold">Your Answer</h2>
        <div className={`text-base sm:text-lg font-semibold ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
          Time Left: {formatTime(timeLeft)}
        </div>
      </div>

      <textarea
        value={answer}
        onChange={(e) => {
          setAnswer(e.target.value);
          setSpoken(!!e.target.value);
        }}
        disabled={transcribing}
        className="w-full h-24 sm:h-32 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none text-sm sm:text-base"
        placeholder="Type your answer here..."
      />

      <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
        <button
          onMouseEnter={() => setHoveredButton("start")}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={startListening}
          disabled={!canStart || timeLeft <= 0}
          className={`${btnClass(canStart && timeLeft > 0)} text-sm sm:text-base w-full sm:w-auto`}
        >
          {startLabel}
          {(!canStart || timeLeft <= 0) && hoveredButton === "start" && (
            <XCircle className="ml-2 text-red-500" />
          )}
        </button>

        <button
          onMouseEnter={() => setHoveredButton("stop")}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={stopListening}
          disabled={!canStop}
          className={`${btnClass(canStop)} text-sm sm:text-base w-full sm:w-auto`}
        >
          Stop Speaking
          {!canStop && hoveredButton === "stop" && (
            <XCircle className="ml-2 text-red-500" />
          )}
        </button>

        <button
          onMouseEnter={() => setHoveredButton("submit")}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`${btnClass(canSubmit)} text-sm sm:text-base w-full sm:w-auto`}
        >
          {submitLabel}
          {!canSubmit && hoveredButton === "submit" && (
            <XCircle className="ml-2 text-red-500" />
          )}
        </button>
      </div>
    </div>
  );
}
