import { useState } from "react";
import { useAssets, useAssignments } from "../../../api";
import { Empty, Icon, Loading } from "../../../components/ui";
import type { Asset, AssetAssignment } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { useEmployeeLookup } from "../useEmployeeLookup";
import { AssetForm } from "./AssetForm";
import { AssetsTable } from "./AssetsTable";
import { AssignAssetModal } from "./AssignAssetModal";
import { ReturnAssetModal } from "./ReturnAssetModal";

export function EquipmentPage() {
  const { can } = useAuth();
  const assets = useAssets();
  const assignments = useAssignments();
  const { employeeName } = useEmployeeLookup();
  const [editing, setEditing] = useState<Asset | "new" | null>(null);
  const [assigning, setAssigning] = useState<Asset | null>(null);
  const [returning, setReturning] = useState<AssetAssignment | null>(null);
  const openAssignment = (assetId: string) => assignments.data?.find((x) => x.asset_id === assetId && !x.returned_on);
  const list = assets.data ?? [];
  const canEdit = can("hr.equipment", "edit");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Equipment</h1>
          <p>Company equipment — laptops, phones, ID cards — and who has what. History is kept for every handover.</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setEditing("new")}><Icon name="plus" size={16} /> Add equipment</button>
        )}
      </div>
      <div className="card">
        {assets.isLoading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty title="No equipment yet" />
        ) : (
          <AssetsTable
            assets={list}
            openAssignment={openAssignment}
            employeeName={employeeName}
            canEdit={canEdit}
            onEdit={setEditing}
            onAssign={setAssigning}
            onReturn={setReturning}
          />
        )}
      </div>
      {editing && <AssetForm asset={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {assigning && <AssignAssetModal assetId={assigning.id} onClose={() => setAssigning(null)} />}
      {returning && <ReturnAssetModal assignment={returning} onClose={() => setReturning(null)} />}
    </div>
  );
}
