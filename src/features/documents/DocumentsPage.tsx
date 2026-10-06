import { useMemo, useState } from "react";
import { useDocuments, useLookups } from "../../api";
import { Empty, Icon, Loading, Tabs } from "../../components/ui";
import { DOCUMENT_CATEGORIES } from "../../lib/labels";
import { useAuth } from "../auth/AuthContext";
import { DocumentTable } from "./DocumentTable";
import { DocumentUploadModal } from "./DocumentUploadModal";

type Who = "all" | "team" | "advisors";

export function DocumentsPage() {
  const { canEditAny } = useAuth();
  const documents = useDocuments();
  const { areas, personById } = useLookups();
  const [who, setWho] = useState<Who>("all");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    return (documents.data ?? []).filter((d) => {
      const uploader = d.uploaded_by ? personById.get(d.uploaded_by) : undefined;
      const external = uploader?.role === "external";
      if (who === "team" && external) return false;
      if (who === "advisors" && !external) return false;
      if (area && d.area_id !== area) return false;
      if (category && d.category !== category) return false;
      if (q && !`${d.title} ${d.description ?? ""} ${d.file_name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [documents.data, personById, who, area, category, q]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Shared documents</h1>
          <p>Everything shared in each area — what you've sent your CA or lawyer, and what they've sent back.</p>
        </div>
        {canEditAny && (
          <button className="btn btn-primary" onClick={() => setUploading(true)}>
            <Icon name="plus" size={16} /> Share document
          </button>
        )}
      </div>

      <div className="toolbar">
        <Tabs
          value={who}
          onChange={setWho}
          items={[
            { value: "all", label: "All" },
            { value: "team", label: "Shared by our team" },
            { value: "advisors", label: "From advisors" },
          ]}
        />
        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All areas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="input search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {documents.isLoading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <Empty title="No documents yet" />
        ) : (
          <DocumentTable docs={filtered} />
        )}
      </div>

      {uploading && <DocumentUploadModal onClose={() => setUploading(false)} />}
    </div>
  );
}
