import type { ReactNode } from "react";
import { errorMessage } from "../../lib/format";

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  return <div className="alert alert-error">{errorMessage(error)}</div>;
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
