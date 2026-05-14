const MovieSkeleton = () => {
  return (
    <div className="w-full text-left">
      <div className="relative aspect-[2/3] w-full animate-pulse overflow-hidden rounded-2xl bg-[#e5e1d8]"></div>
      <div className="px-1 pb-1 pt-3">
        <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-[#e5e1d8]"></div>
        <div className="h-3 w-1/2 animate-pulse rounded bg-[#e5e1d8]"></div>
      </div>
    </div>
  );
};

export default MovieSkeleton;
