import type { Asset, AssetAssignment } from "../../../lib/types";
import { formatDate } from "../../../lib/dates";
import { ASSET_STATUS_LABEL } from "../labels";

const STATUS_BADGE = { available: "badge-green", assigned: "badge-blue", repair: "badge-amber", retired: "badge-gray" } as const;

interface Props {
  assets: Asset[];
  openAssignment: (assetId: string) => AssetAssignment | undefined;
  employeeName: (id: string) => string;
  canEdit: boolean;
  onEdit: (a: Asset) => void;
  onAssign: (a: Asset) => void;
  onReturn: (x: AssetAssignment) => void;
}

export function AssetsTable({ assets, openAssignment, employeeName, canEdit, onEdit, onAssign, onReturn }: Props) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Equipment</th><th>Category</th><th>Status</th><th>With</th><th /></tr>
        </thead>
        <tbody>
          {assets.map((a) => {
            const open = openAssignment(a.id);
            return (
              <tr key={a.id} className={canEdit ? "clickable" : undefined} onClick={() => canEdit && onEdit(a)}>
                <td>
                  <div className="cell-title">{a.name}</div>
                  {a.serial_number && <div className="cell-sub">SN {a.serial_number}</div>}
                </td>
                <td>{a.category}</td>
                <td><span className={`badge ${STATUS_BADGE[a.status]}`}>{ASSET_STATUS_LABEL[a.status]}</span></td>
                <td>
                  {open ? <>{employeeName(open.employee_id)}<div className="cell-sub">since {formatDate(open.assigned_on)}</div></> : "—"}
                </td>
                <td className="nowrap" style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  {canEdit && open && <button className="btn btn-sm" onClick={() => onReturn(open)}>Mark returned</button>}
                  {canEdit && !open && a.status === "available" && <button className="btn btn-sm" onClick={() => onAssign(a)}>Give to…</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
