interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  value, onChange, items,
}: { value: T; onChange: (v: T) => void; items: Array<TabItem<T>> }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          className={`tab${value === it.value ? " active" : ""}`}
          onClick={() => onChange(it.value)}
        >
          {it.label}
          {it.count !== undefined && <span className="count">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}
