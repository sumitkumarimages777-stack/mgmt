import { useState } from "react";
import { useDocuments } from "../../../api";
import { Icon, Loading } from "../../../components/ui";
import type { Employee } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { DocumentTable } from "../../documents/DocumentTable";
import { DocumentUploadModal } from "../../documents/DocumentUploadModal";
import { HR_DOCUMENT_CATEGORIES } from "../labels";

export function DocumentsTab({ employee }: { employee: Employee }) {
  const { can } = useAuth();
  const documents = useDocuments();
  const [uploading, setUploading] = useState(false);
  const docs = (documents.data ?? []).filter((d) => d.employee_id === employee.id);

  return (
    <div className="card">
      <div className="card-head">
        <h2>Contracts & documents</h2>
        {can("hr.documents", "edit") && (
          <button className="btn btn-sm" onClick={() => setUploading(true)}><Icon name="plus" size={15} /> Add document</button>
        )}
      </div>
      <div className="card-pad">{documents.isLoading ? <Loading /> : <DocumentTable docs={docs} showSource={false} />}</div>
      {uploading && (
        <DocumentUploadModal
          categories={HR_DOCUMENT_CATEGORIES}
          defaults={{ module: "hr", feature: "documents", employee_id: employee.id, category: "Employment contract" }}
          onClose={() => setUploading(false)}
        />
      )}
    </div>
  );
}
