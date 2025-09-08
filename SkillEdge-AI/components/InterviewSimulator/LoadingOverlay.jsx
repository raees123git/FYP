export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-75 z-10">
      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-white text-base sm:text-lg">Generating Questions...</p>
    </div>
  );
}
