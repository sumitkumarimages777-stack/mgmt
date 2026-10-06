import { useEffect, type ReactNode } from "react";
import { filingDueState, relativeDue, type DueState } from "../lib/dates";
import type { Area, Filing, RequestStatus } from "../lib/types";
import { FILING_STATUS_LABEL, REQUEST_STATUS_LABEL } from "../lib/types";

export function Modal({
  title, onClose, children, footer, wide,
}: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const msg = error instanceof Error ? error.message
    : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message)
    : String(error);
  return <div className="alert alert-error">{msg}</div>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function Loading() {
  return <div className="spinner">Loading…</div>;
}

export function AreaTag({ area }: { area: Area | undefined }) {
  if (!area) return <span className="area-tag">—</span>;
  return (
    <span className="area-tag">
      <span className="area-dot" style={{ background: area.color }} />
      {area.name}
    </span>
  );
}

const DUE_BADGE: Record<DueState, [string, string]> = {
  overdue: ["badge-red", "Overdue"],
  due_soon: ["badge-amber", "Due soon"],
  upcoming: ["badge-gray", "Upcoming"],
  filed: ["badge-green", "Filed"],
  not_applicable: ["badge-gray", "N/A"],
};

export function FilingBadge({ filing }: { filing: Pick<Filing, "status" | "due_date"> }) {
  const state = filingDueState(filing);
  const [cls, label] = DUE_BADGE[state];
  const text = filing.status === "in_progress" && (state === "upcoming" || state === "due_soon")
    ? FILING_STATUS_LABEL.in_progress
    : label;
  return <span className={`badge ${cls}`}>{text}</span>;
}

export function DueText({ filing }: { filing: Pick<Filing, "status" | "due_date"> }) {
  const state = filingDueState(filing);
  if (state === "filed" || state === "not_applicable") return null;
  return (
    <div className="cell-sub" style={state === "overdue" ? { color: "var(--red)" } : undefined}>
      {relativeDue(filing.due_date)}
    </div>
  );
}

const REQ_BADGE: Record<RequestStatus, string> = {
  open: "badge-amber",
  submitted: "badge-blue",
  accepted: "badge-green",
  rejected: "badge-red",
  cancelled: "badge-gray",
};

export function RequestBadge({ status }: { status: RequestStatus }) {
  return <span className={`badge ${REQ_BADGE[status]}`}>{REQUEST_STATUS_LABEL[status]}</span>;
}

export function Tabs<T extends string>({
  value, onChange, items,
}: { value: T; onChange: (v: T) => void; items: Array<{ value: T; label: string; count?: number }> }) {
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

const ICONS: Record<string, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" /></>,
  file: <><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5" /></>,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  logout: <><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  download: <><path d="M12 4v11M7 10l5 5 5-5" /><path d="M5 20h14" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></>,
};

export function Icon({ name, size = 18 }: { name: keyof typeof ICONS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
