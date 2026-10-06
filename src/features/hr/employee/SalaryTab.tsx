import type { Employee } from "../../../lib/types";
import { PayrollCard } from "./PayrollCard";
import { SalaryHistory } from "./SalaryHistory";

export function SalaryTab({ employee }: { employee: Employee }) {
  return (
    <div className="grid">
      <SalaryHistory employee={employee} />
      <PayrollCard employee={employee} />
    </div>
  );
}
