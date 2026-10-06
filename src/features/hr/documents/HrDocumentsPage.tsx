import { useMemo, useState } from "react";
import { useDocuments } from "../../../api";
import { Empty, Icon, Loading, SelectField } from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { DocumentTable } from "../../documents/DocumentTable";
import { DocumentUploadModal } from "../../documents/DocumentUploadModal";
import { HR_DOCUMENT_CATEGORIES } from "../labels";
import { useEmployeeLookup } from "../useEmployeeLookup";

export function HrDocumentsPage() {
  const { can } = useAuth();
  const documents = useDocuments();
  const { employees, employeeName } = useEmployeeLookup();
  const [employeeId, setEmployeeId] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);

  const docs = useMemo(
    () =>
      (documents.data ?? []).filter(
        (d) => d.module === "hr" && (!employeeId || d.employee_id === employeeId) && (!category || d.category === category),
      ),
    [documents.data, employeeId, category],
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Contracts & documents</h1>
          <p>Offer letters, contracts, ID proofs and other HR paperwork for every team member.</p>
        </div>
        {can("hr.documents", "edit") && (
          <button className="btn btn-primary" disabled={!employeeId} title={employeeId ? undefined : "Choose a team member first"} onClick={() => setUploading(true)}>
            <Icon name="plus" size={16} /> Add document
          </button>
        )}
      </div>
      <div className="toolbar">
        <div style={{ minWidth: 220 }}>
          <SelectField label="Team member" allowEmpty value={employeeId} onChange={setEmployeeId} options={employees.map((e) => ({ value: e.id, label: e.full_name }))} />
        </div>
        <div style={{ minWidth: 200 }}>
          <SelectField label="Category" allowEmpty value={category} onChange={setCategory} options={HR_DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </div>
      </div>
      <div className="card">
        {documents.isLoading ? (
          <Loading />
        ) : docs.length === 0 ? (
          <Empty title="No HR documents yet">{can("hr.documents", "edit") && "Choose a team member above, then add their documents."}</Empty>
        ) : (
          <DocumentTable docs={docs} showSource={false} extra={{ header: "Team member", render: (d) => employeeName(d.employee_id) }} />
        )}
      </div>
      {uploading && (
        <DocumentUploadModal
          categories={HR_DOCUMENT_CATEGORIES}
          defaults={{ module: "hr", feature: "documents", employee_id: employeeId, category: "Employment contract" }}
          onClose={() => setUploading(false)}
        />
      )}
    </div>
  );
}
