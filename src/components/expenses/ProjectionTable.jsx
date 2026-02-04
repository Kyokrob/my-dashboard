import { budgetByCategory, categoryOrder } from "../../../server/src/config/budget.js";
import { formatTHB } from "../../utils/money.js";
import { getStatus } from "../../utils/rollups.js";
import StatusBadge from "../common/StatusBadge.jsx";
import "./ProjectionTable.scss";

export default function ProjectionTable({ tier, actualByCat }) {
  return (
    <div className="proj">
      <div className="proj__grid proj__grid--head">
        <div>Category</div>
        <div className="right">Budget</div>
        <div className="right">Actual</div>
        <div className="right">Remaining</div>
        <div className="center">Status</div>
      </div>

      {categoryOrder.map((cat) => {
        const budget = budgetByCategory[cat][tier];
        const actual = actualByCat[cat] || 0;
        const remaining = budget - actual;
        const status = getStatus(remaining, budget);

        return (
          <div className="proj__grid" key={cat}>
            <div>{cat}</div>
            <div className="right">{formatTHB(budget)}</div>
            <div className="right">{formatTHB(actual)}</div>
            <div className={`right ${remaining < 0 ? "neg" : ""}`}>{formatTHB(remaining)}</div>
            <div className="center"><StatusBadge status={status} /></div>
          </div>
        );
      })}
    </div>
  );
}
