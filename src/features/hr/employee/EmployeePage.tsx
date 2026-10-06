import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEmployees } from "../../../api";
import { Empty, Loading, Tabs } from "../../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { EMPLOYEE_STATUS_LABEL } from "../labels";
import { DocumentsTab } from "./DocumentsTab";
import { EquipmentTab } from "./EquipmentTab";
import { EsopTab } from "./EsopTab";
import { OverviewTab } from "./OverviewTab";
import { SalaryTab } from "./SalaryTab";

type Tab = "overview" | "salary" | "documents" | "equipment" | "esop";

const TABS: Array<{ value: Tab; label: string; perm: string }> = [
  { value: "overview", label: "Overview", perm: "hr.team" },
  { value: "salary", label: "Salary & payroll", perm: "hr.compensation" },
  { value: "documents", label: "Documents", perm: "hr.documents" },
  { value: "equipment", label: "Equipment", perm: "hr.equipment" },
  { value: "esop", label: "ESOPs", perm: "hr.esop" },
];

export function EmployeePage() {
  const { id } = useParams();
  const { can } = useAuth();
  const employees = useEmployees();
  const [tab, setTab] = useState<Tab>("overview");
  const employee = employees.data?.find((e) => e.id === id);
  // "own" is enough to open a tab; RLS limits it to the person's own data.
  const tabs = TABS.filter((t) => can(t.perm, "own"));

  if (employees.isLoading) return <div className="page"><Loading /></div>;
  if (!employee) {
    return <div className="page"><div className="card"><Empty title="Team member not found" /></div></div>;
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          {can("hr.team", "view") && <Link to="/hr/team" className="small">← Team members</Link>}
          <h1>{employee.full_name}</h1>
          <p>
            {[employee.designation, employee.department].filter(Boolean).join(" · ") || "—"} · {EMPLOYEE_STATUS_LABEL[employee.status]}
          </p>
        </div>
      </div>
      <div className="toolbar">
        <Tabs value={tab} onChange={setTab} items={tabs.map(({ value, label }) => ({ value, label }))} />
      </div>
      {tab === "overview" && <OverviewTab employee={employee} />}
      {tab === "salary" && <SalaryTab employee={employee} />}
      {tab === "documents" && <DocumentsTab employee={employee} />}
      {tab === "equipment" && <EquipmentTab employee={employee} />}
      {tab === "esop" && <EsopTab employee={employee} />}
    </div>
  );
}
