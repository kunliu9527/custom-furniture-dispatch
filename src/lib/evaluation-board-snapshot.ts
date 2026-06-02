import type { EvaluationViewMode } from "./evaluation-stats";
import { getSubViewTitle } from "./evaluation-side-nav";
import type { EvaluationSubView } from "./evaluation-ui-persistence";
import type { BoardSnapshotConfig } from "./board-snapshot-types";

export function buildEvaluationBoardSnapshot(
  viewMode: EvaluationViewMode,
  subView: EvaluationSubView,
): BoardSnapshotConfig {
  return {
    label: getSubViewTitle(viewMode, subView),
  };
}
