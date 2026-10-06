import { useState } from "react";
import { deleteAsset, keys, saveAsset, useWrite, type AssetInput } from "../../../api";
import { ErrorBox, Modal, SelectField, TextField } from "../../../components/ui";
import { optionsFrom } from "../../../lib/options";
import type { Asset, AssetStatus } from "../../../lib/types";
import { useAuth } from "../../auth/AuthContext";
import { ASSET_CATEGORIES, ASSET_STATUS_LABEL } from "../labels";

export function AssetForm({ asset, onClose }: { asset?: Asset; onClose: () => void }) {
  const { can } = useAuth();
  const [form, setForm] = useState<AssetInput>(asset ?? { name: "", category: "Laptop", status: "available" });
  const set = <K extends keyof AssetInput>(k: K, v: AssetInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useWrite((f: AssetInput) => saveAsset(asset?.id ?? null, {
    name: f.name?.trim(), category: f.category, status: f.status, cost: f.cost ?? null,
    serial_number: f.serial_number || null, purchase_date: f.purchase_date || null, notes: f.notes || null,
  }), [keys.assets]);
  const remove = useWrite(() => deleteAsset(asset!.id), [keys.assets, keys.assignments]);
  // "assigned" is set automatically when the equipment is given to someone.
  const statusOptions = optionsFrom(ASSET_STATUS_LABEL).filter((o) => o.value !== "assigned" || asset?.status === "assigned");

  const footer = (
    <>
      {asset && can("hr.equipment", "manage") && (
        <button className="btn btn-ghost btn-danger" onClick={() => confirm(`Delete ${asset.name} and its history?`) && remove.mutate(undefined, { onSuccess: onClose })}>Delete</button>
      )}
      <span className="spacer" />
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!form.name?.trim() || save.isPending} onClick={() => save.mutate(form, { onSuccess: onClose })}>Save</button>
    </>
  );

  return (
    <Modal title={asset ? `Edit ${asset.name}` : "Add equipment"} onClose={onClose} footer={footer}>
      <div className="form">
        <div className="form-row">
          <TextField label="Name" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. MacBook Air M3" />
          <SelectField label="Category" value={form.category} onChange={(v) => set("category", v)} options={ASSET_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </div>
        <div className="form-row">
          <TextField label="Serial number" value={form.serial_number} onChange={(v) => set("serial_number", v)} />
          <SelectField label="Status" value={form.status} onChange={(v) => set("status", v as AssetStatus)} options={statusOptions} />
        </div>
        <div className="form-row">
          <TextField label="Purchase date" type="date" value={form.purchase_date} onChange={(v) => set("purchase_date", v)} />
          <TextField label="Cost (₹)" type="number" value={form.cost?.toString()} onChange={(v) => set("cost", v ? Number(v) : null)} />
        </div>
        <TextField label="Notes" value={form.notes} onChange={(v) => set("notes", v)} />
        <ErrorBox error={save.error ?? remove.error} />
      </div>
    </Modal>
  );
}
