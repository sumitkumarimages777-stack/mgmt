import { useMemo, useState } from "react";
import { useDocuments } from "../../../api";
import { Empty, Icon, Loading, Tabs } from "../../../components/ui";
import { DOCUMENT_CATEGORIES } from "../../../lib/labels";
import { useAuth } from "../../auth/AuthContext";
import { DocumentTable } from "../../documents/DocumentTable";
import { DocumentUploadModal } from "../../documents/DocumentUploadModal";

type Who = "all" | "me" | "others";

/** Every CA document the user may see: records, files sent for requests, filing proofs. */
export function RecordsPage() {
  const { profile, can } = useAuth();
  const documents = useDocuments();
  const [who, setWho] = useState<Who>("all");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(() => {
    const text = q.toLowerCase();
    return (documents.data ?? []).filter((d) => {
      if (d.module !== "ca") return false;
      const mine = d.uploaded_by === profile?.id;
      if ((who === "me" && !mine) || (who === "others" && mine)) return false;
      if (category && d.category !== category) return false;
      return !text || `${d.title} ${d.description ?? ""} ${d.file_name ?? ""}`.toLowerCase().includes(text);
    });
  }, [documents.data, profile?.id, who, category, q]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Records</h1>
          <p>Everything shared with the CA — what you sent, what they sent back, and filing acknowledgements.</p>
        </div>
        {can("ca.documents", "edit") && (
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
            { value: "me", label: "Shared by me" },
            { value: "others", label: "Shared by others" },
          ]}
        />
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {DOCUMENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="input search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {documents.isLoading ? <Loading /> : filtered.length === 0 ? <Empty title="No documents yet" /> : <DocumentTable docs={filtered} />}
      </div>

      {uploading && <DocumentUploadModal defaults={{ module: "ca", feature: "documents" }} onClose={() => setUploading(false)} />}
    </div>
  );
}
