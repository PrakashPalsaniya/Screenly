const FullScreenLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171717]/75 px-4 backdrop-blur-md">
      <div className="cine-surface flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl px-8 py-9 text-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#8f46ff] border-t-transparent shadow-[0_0_30px_rgba(143,70,255,0.35)]" />
        <p className="text-base font-semibold text-[#171717] sm:text-lg">
          Warming up the projector...
        </p>
      </div>
    </div>
  );
};

export default FullScreenLoader;
