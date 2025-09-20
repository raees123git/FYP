export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-10">
      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-foreground text-base sm:text-lg">Generating Questions...</p>
    </div>
  );
}
