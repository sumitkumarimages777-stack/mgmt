import { useProfiles, type EmployeeInput } from "../../../api";
import { SelectField, TextField } from "../../../components/ui";
import { optionsFrom } from "../../../lib/options";
import type { EmployeeStatus, EmploymentType } from "../../../lib/types";
import { EMPLOYEE_STATUS_LABEL, EMPLOYMENT_TYPE_LABEL } from "../labels";
import { useEmployeeLookup } from "../useEmployeeLookup";
import type { SetField } from "./EmployeeForm";

/** Role, employment and login fields of the employee form. */
export function JobFields({ form, set, selfId }: { form: EmployeeInput; set: SetField; selfId?: string }) {
  const { employees } = useEmployeeLookup();
  const profiles = useProfiles();
  const linked = new Set(employees.filter((e) => e.id !== selfId && e.profile_id).map((e) => e.profile_id));
  const logins = (profiles.data ?? []).filter((p) => !linked.has(p.id));

  return (
    <>
      <div className="form-row">
        <TextField label="Full name" value={form.full_name} onChange={(v) => set("full_name", v)} />
        <TextField label="Employee code" value={form.employee_code} onChange={(v) => set("employee_code", v)} placeholder="optional" />
      </div>
      <div className="form-row">
        <TextField label="Designation" value={form.designation} onChange={(v) => set("designation", v)} placeholder="e.g. Software Engineer" />
        <TextField label="Department" value={form.department} onChange={(v) => set("department", v)} placeholder="e.g. Engineering" />
      </div>
      <div className="form-row">
        <SelectField label="Type" value={form.employment_type} onChange={(v) => set("employment_type", v as EmploymentType)} options={optionsFrom(EMPLOYMENT_TYPE_LABEL)} />
        <SelectField label="Status" value={form.status} onChange={(v) => set("status", v as EmployeeStatus)} options={optionsFrom(EMPLOYEE_STATUS_LABEL)} />
      </div>
      <div className="form-row">
        <TextField label="Date of joining" type="date" value={form.date_of_joining} onChange={(v) => set("date_of_joining", v)} />
        <TextField label="Date of exit" type="date" value={form.date_of_exit} onChange={(v) => set("date_of_exit", v)} hint="ESOP vesting stops on this date." />
      </div>
      <div className="form-row">
        <SelectField
          label="Reports to"
          allowEmpty
          value={form.manager_id}
          onChange={(v) => set("manager_id", v || null)}
          options={employees.filter((e) => e.id !== selfId).map((e) => ({ value: e.id, label: e.full_name }))}
        />
        <SelectField
          label="Panel login (for self-service)"
          allowEmpty
          value={form.profile_id}
          onChange={(v) => set("profile_id", v || null)}
          options={logins.map((p) => ({ value: p.id, label: `${p.full_name || p.email} (${p.email})` }))}
        />
      </div>
      <div className="form-row">
        <TextField label="Work email" type="email" value={form.work_email} onChange={(v) => set("work_email", v)} />
        <TextField label="Phone" type="tel" value={form.phone} onChange={(v) => set("phone", v)} />
      </div>
    </>
  );
}
