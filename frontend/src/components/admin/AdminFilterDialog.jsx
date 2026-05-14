import { X, SlidersHorizontal } from "lucide-react";
import { Search } from "lucide-react";

const AdminFilterDialog = ({
  isOpen,
  onClose,
  title,
  searchValue,
  onSearchChange,
  filters = [],
  onFilterChange,
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
            <h2 className="text-[16px] font-black text-[#171717]">{title}</h2>
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
          {/* Search */}
          <div>
            <label className="relative block">
              <Search className="absolute left-3 top-2.5 text-[#8b8179]" size={16} />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="cine-focus w-full rounded-xl border border-black/10 bg-white px-3 py-2 pl-9 text-[13px] font-semibold outline-none"
              />
            </label>
          </div>

          {/* Filter Dropdowns */}
          {filters.map((filter) => (
            <div key={filter.key}>
              <label className="mb-2 block text-[13px] font-bold text-[#171717]">
                {filter.label}
              </label>
              <select
                value={filter.value}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                className="cine-focus w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] font-semibold outline-none"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-black/10 bg-white px-4 py-3 md:px-5">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-[#171717] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#2a2a2a]"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminFilterDialog;
