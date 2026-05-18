import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { useState } from "react";

export function MobileSearchFilterBar({
  placeholder,
  searchValue,
  onSearchChange,
  filters = [],
  activeFilter,
  onFilterChange,
  filterLabel = "Фильтры",
}) {
  const [showFilters, setShowFilters] = useState(false);
  const hasFilters = filters.length > 0;

  return (
    <>
      <section className="mobile-inspections-tools">
        <label className="mobile-search-field">
          <SearchOutlined aria-hidden="true" />
          <input
            type="search"
            placeholder={placeholder}
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </label>
        {hasFilters ? (
          <button
            className={`mobile-inspections-filter-button${showFilters ? " is-active" : ""}`}
            type="button"
            aria-label={filterLabel}
            aria-expanded={showFilters}
            onClick={() => setShowFilters((current) => !current)}
          >
            <FilterOutlined aria-hidden="true" />
          </button>
        ) : null}
      </section>

      {hasFilters && showFilters ? (
        <section className="mobile-filter-row" aria-label={filterLabel}>
          {filters.map((filter) => (
            <button
              className={filter === activeFilter ? "is-active" : ""}
              type="button"
              key={filter}
              onClick={() => onFilterChange?.(filter)}
            >
              {filter}
            </button>
          ))}
        </section>
      ) : null}
    </>
  );
}
