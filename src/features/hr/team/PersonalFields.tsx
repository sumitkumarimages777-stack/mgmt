import type { EmployeeInput } from "../../../api";
import { TextField } from "../../../components/ui";
import type { SetField } from "./EmployeeForm";

export function PersonalFields({ form, set }: { form: EmployeeInput; set: SetField }) {
  return (
    <>
      <div className="form-row">
        <TextField label="Personal email" type="email" value={form.personal_email} onChange={(v) => set("personal_email", v)} />
        <TextField label="Date of birth" type="date" value={form.date_of_birth} onChange={(v) => set("date_of_birth", v)} />
      </div>
      <TextField label="Address" value={form.address} onChange={(v) => set("address", v)} />
      <TextField label="Emergency contact" value={form.emergency_contact} onChange={(v) => set("emergency_contact", v)} placeholder="Name, relation, phone" />
      <label className="field">
        <span>Notes</span>
        <textarea className="textarea" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </label>
    </>
  );
}
