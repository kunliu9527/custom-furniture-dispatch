import { StatusBreakdown } from "@/components/manager/status-breakdown";
import { InteractiveBreakdown } from "@/components/shared/interactive-breakdown";
import { normalizeDispatcherName } from "@/lib/admin-stats";
import { countOrdersByStatus } from "@/lib/manager-stats";
import {
  applyResultDrillFilters,
  countByDesigner,
  countByDispatcher,
  drillFilterLabel,
  drillSourceForDimension,
  hasActiveDrill,
  type DrillFlow,
  type ResultDrillFilters,
} from "@/lib/result-drill";
import type { Order, OrderStatus } from "@/lib/types";

interface ResultDrillPanelProps {
  baseOrders: Order[];
  drill: ResultDrillFilters;
  onDrillChange: (drill: ResultDrillFilters) => void;
  flow: DrillFlow;
}

function mapToItems(map: Map<string, number>) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, label: key, count }));
}

export function ResultDrillPanel({
  baseOrders,
  drill,
  onDrillChange,
  flow,
}: ResultDrillPanelProps) {
  const showStatus = flow.includes("status");
  const showDesigner = flow.includes("designer");
  const showDispatcher = flow.includes("dispatcher");

  const statusSource = drillSourceForDimension(baseOrders, drill, "status");
  const statusCounts = countOrdersByStatus(statusSource);

  const ordersAfterStatus =
    drill.status !== "全部"
      ? applyResultDrillFilters(baseOrders, {
          status: drill.status,
          designer: "全部",
          dispatcher: "全部",
          store: "全部",
        })
      : [];

  const designerSource = drillSourceForDimension(
    showStatus && drill.status !== "全部" ? ordersAfterStatus : baseOrders,
    drill,
    "designer",
  );
  const designerItems = mapToItems(countByDesigner(designerSource));

  const ordersAfterDesigner =
    drill.designer !== "全部"
      ? applyResultDrillFilters(baseOrders, {
          ...drill,
          dispatcher: "全部",
          store: "全部",
        })
      : ordersAfterStatus;

  const dispatcherSource = drillSourceForDimension(
    ordersAfterDesigner.length > 0 ? ordersAfterDesigner : ordersAfterStatus,
    drill,
    "dispatcher",
  );
  const dispatcherItems = mapToItems(countByDispatcher(dispatcherSource));

  const clearDrill = () =>
    onDrillChange({
      status: "全部",
      designer: "全部",
      dispatcher: "全部",
      store: "全部",
    });

  const designerStepReady = !showStatus || drill.status !== "全部";
  const dispatcherStepReady =
    showDispatcher &&
    (!showStatus || drill.status !== "全部") &&
    (!showDesigner || drill.designer !== "全部");

  return (
    <div className="space-y-4">
      {hasActiveDrill(drill) ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">结果筛选：</span>
          <span className="rounded-md bg-indigo-50 px-2 py-1 font-medium text-indigo-800">
            {drillFilterLabel(drill)}
          </span>
          <button
            type="button"
            onClick={clearDrill}
            className="text-indigo-600 hover:text-indigo-800"
          >
            清除
          </button>
        </div>
      ) : null}

      {showStatus ? (
        <StatusBreakdown
          counts={statusCounts}
          total={statusSource.length}
          title="结果内各状态"
          interactive
          selected={drill.status}
          onSelect={(s) =>
            onDrillChange({
              ...drill,
              status: s as OrderStatus | "全部",
              designer: "全部",
              dispatcher: "全部",
              store: "全部",
            })
          }
        />
      ) : null}

      {showDesigner ? (
        designerStepReady ? (
          <InteractiveBreakdown
            title={
              drill.status !== "全部"
                ? `「${drill.status}」的设计师分布`
                : "结果内设计师分布"
            }
            items={designerItems}
            total={designerSource.length}
            selected={drill.designer}
            onSelect={(key) =>
              onDrillChange({
                ...drill,
                designer: key,
                dispatcher: "全部",
                store: "全部",
              })
            }
          />
        ) : (
          <p className="text-xs text-slate-400">
            请先点击上方状态标签，再按设计师筛选
          </p>
        )
      ) : null}

      {showDispatcher ? (
        dispatcherStepReady && dispatcherItems.length > 0 ? (
          <InteractiveBreakdown
            title={
              drill.designer !== "全部"
                ? `「${drill.designer}」的派单人分布`
                : `「${drill.status}」的派单人分布`
            }
            items={dispatcherItems}
            total={dispatcherSource.length}
            selected={drill.dispatcher}
            onSelect={(key) =>
              onDrillChange({
                ...drill,
                dispatcher:
                  key === "全部" ? "全部" : normalizeDispatcherName(key),
              })
            }
          />
        ) : showStatus && drill.status === "全部" ? (
          <p className="text-xs text-slate-400">
            请先选择状态，再按派单人筛选
          </p>
        ) : null
      ) : null}
    </div>
  );
}
