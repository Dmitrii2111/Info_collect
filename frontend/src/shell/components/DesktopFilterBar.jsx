export function DesktopFilterBar({ filters = [], quickFilters = [] }) {
  if (filters.length === 0 && quickFilters.length === 0) {
    return null;
  }

  return (
    <section className="desktop-filter-card">
      {filters.length > 0 ? (
        <div className={`desktop-filter-grid desktop-filter-grid-${filters.length}`}>
          {filters.map((filter) => (
            <label className="desktop-filter-field" key={filter.label}>
              <span>{filter.label}</span>
              <select defaultValue={filter.options[0]}>
                {filter.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
      {quickFilters.length > 0 ? (
        <div className="desktop-filter-pills">
          {quickFilters.map((filter, index) => (
            <button
              className={`desktop-filter-pill${index === 0 ? " is-active" : ""}${filter.tone ? ` tone-${filter.tone}` : ""}`}
              key={filter.label}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
