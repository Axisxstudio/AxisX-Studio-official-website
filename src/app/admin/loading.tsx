export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-[#a3a6ff]/20 border-t-[#a3a6ff] rounded-full animate-spin"></div>
      <p className="text-[#adaaad] text-sm animate-pulse">Syncing AxisX Cloud...</p>
    </div>
  );
}
