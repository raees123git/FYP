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
    `${enabled ? "bg-primary hover:bg-primary/90" : "bg-muted cursor-not-allowed"} px-6 py-2 rounded-lg text-primary-foreground flex items-center transition-all`;

  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl border border-border space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Your Answer</h2>
        <div className={`text-base sm:text-lg font-semibold ${timeLeft <= 30 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
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
        className="w-full h-24 sm:h-32 p-3 bg-input text-foreground rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base placeholder:text-muted-foreground"
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
