import { useSearchParams } from "react-router-dom";
import { Tabs } from "../../../components/ui";
import { todayISO } from "../../../lib/dates";
import { TdsHistory } from "./TdsHistory";
import { TdsMonth } from "./TdsMonth";
import { addMonths, monthOf } from "./tdsLogic";

type Tab = "month" | "history";

export function TdsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "month";
  // Default to last month: its TDS is the one being paid now.
  const month = params.get("month") || addMonths(monthOf(todayISO()), -1);
  const go = (next: { tab?: Tab; month?: string }) => setParams({ tab: next.tab ?? tab, month: next.month ?? month });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>TDS</h1>
          <p>Monthly TDS register: whose TDS is deducted, how much, and whether the challan has been paid.</p>
        </div>
      </div>
      <div className="toolbar">
        <Tabs
          value={tab}
          onChange={(t) => go({ tab: t })}
          items={[
            { value: "month", label: "Month register" },
            { value: "history", label: "Past months" },
          ]}
        />
      </div>
      {tab === "month" ? (
        <TdsMonth month={month} onMonth={(m) => go({ month: m })} />
      ) : (
        <TdsHistory onOpen={(m) => go({ tab: "month", month: m })} />
      )}
    </div>
  );
}
