import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { keys, saveEmployee, useWrite, type EmployeeInput } from "../../../api";
import { ErrorBox, Modal } from "../../../components/ui";
import type { Employee } from "../../../lib/types";
import { JobFields } from "./JobFields";
import { PersonalFields } from "./PersonalFields";

const EMPTY: EmployeeInput = { full_name: "", employment_type: "full_time", status: "active" };

/** Create or edit a team member. Empty strings are saved as nulls. */
export function EmployeeForm({ employee, onClose }: { employee?: Employee; onClose: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<EmployeeInput>(employee ?? EMPTY);
  const set = <K extends keyof EmployeeInput>(k: K, v: EmployeeInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useWrite(async (input: EmployeeInput) => {
    const clean = Object.fromEntries(Object.entries(input).map(([k, v]) => [k, v === "" ? null : v])) as EmployeeInput;
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = clean as Employee;
    return saveEmployee(employee?.id ?? null, rest);
  }, [keys.employees]);

  const submit = () =>
    save.mutate(form, {
      onSuccess: (saved) => {
        onClose();
        if (!employee) navigate(`/hr/team/${saved.id}`);
      },
    });

  const footer = (
    <>
      <button className="btn" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" disabled={!form.full_name?.trim() || save.isPending} onClick={submit}>
        {save.isPending ? "Saving…" : "Save"}
      </button>
    </>
  );

  return (
    <Modal wide title={employee ? `Edit ${employee.full_name}` : "Add team member"} onClose={onClose} footer={footer}>
      <div className="form">
        <JobFields form={form} set={set} selfId={employee?.id} />
        <div className="section-title" style={{ margin: "6px 0 0" }}>Personal</div>
        <PersonalFields form={form} set={set} />
        <ErrorBox error={save.error} />
      </div>
    </Modal>
  );
}

export type SetField = <K extends keyof EmployeeInput>(k: K, v: EmployeeInput[K]) => void;
