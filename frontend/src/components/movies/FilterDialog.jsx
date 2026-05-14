import { X, SlidersHorizontal } from "lucide-react";
import { languages } from "../../utils/constants";

const FilterDialog = ({
  isOpen,
  onClose,
  selectedGenres,
  selectedLanguages,
  availableGenres,
  onToggleGenre,
  onToggleLanguage,
  onApply,
  onClear,
  topGenres,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90vh] max-w-lg overflow-y-auto rounded-t-2xl bg-white md:bottom-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 md:px-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#171717]" />
            <h2 className="text-[16px] font-black text-[#171717]">Filter by</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-black/5 md:hidden"
            aria-label="Close filters"
          >
            <X size={18} className="text-[#171717]" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 px-4 py-4 md:px-5">
          {/* Genre Section */}
          <div>
            <h3 className="mb-2 text-[13px] font-bold text-[#171717]">Genre</h3>
            <div className="space-y-2">
              {topGenres.map((genre) => (
                <label
                  key={genre}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition hover:bg-black/5"
                >
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre)}
                    onChange={() => onToggleGenre(genre)}
                    className="h-4 w-4 cursor-pointer rounded border-2 border-black/20 accent-[#8f46ff]"
                  />
                  <span className="text-[13px] font-medium text-[#171717]">{genre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Language Section */}
          <div>
            <h3 className="mb-2 text-[13px] font-bold text-[#171717]">Language</h3>
            <div className="space-y-2">
              {languages.map((language) => (
                <label
                  key={language}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition hover:bg-black/5"
                >
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(language)}
                    onChange={() => onToggleLanguage(language)}
                    className="h-4 w-4 cursor-pointer rounded border-2 border-black/20 accent-[#8f46ff]"
                  />
                  <span className="text-[13px] font-medium text-[#171717]">{language}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 space-y-2 border-t border-black/10 bg-white px-4 py-3 md:px-5">
          <button
            onClick={onApply}
            className="w-full rounded-full bg-[#171717] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#2a2a2a]"
          >
            Apply Filters
          </button>
          <button
            onClick={onClear}
            className="w-full rounded-full border border-[#171717] bg-transparent px-4 py-2.5 text-[13px] font-bold text-[#171717] transition hover:bg-black/5"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterDialog;
