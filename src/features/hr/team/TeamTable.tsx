import { useNavigate } from "react-router-dom";
import { formatDate } from "../../../lib/dates";
import type { Employee } from "../../../lib/types";
import { EMPLOYEE_STATUS_LABEL, EMPLOYMENT_TYPE_LABEL } from "../labels";

const STATUS_BADGE = { active: "badge-green", on_notice: "badge-amber", exited: "badge-gray" } as const;

export function TeamTable({ rows }: { rows: Employee[] }) {
  const navigate = useNavigate();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Designation</th>
            <th>Department</th>
            <th>Type</th>
            <th>Joined</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="clickable" onClick={() => navigate(`/hr/team/${e.id}`)}>
              <td>
                <div className="cell-title">{e.full_name}</div>
                <div className="cell-sub">{[e.employee_code, e.work_email].filter(Boolean).join(" · ")}</div>
              </td>
              <td>{e.designation || "—"}</td>
              <td>{e.department || "—"}</td>
              <td className="nowrap">{EMPLOYMENT_TYPE_LABEL[e.employment_type]}</td>
              <td className="nowrap">{formatDate(e.date_of_joining)}</td>
              <td><span className={`badge ${STATUS_BADGE[e.status]}`}>{EMPLOYEE_STATUS_LABEL[e.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
