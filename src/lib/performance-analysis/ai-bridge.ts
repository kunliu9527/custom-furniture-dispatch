import type { PerformanceAnalysisContext } from "./types";

/** 外部 LLM（如 Agnes）增强叙事的接口，当前未接入任何 API */
export interface PerformanceAnalysisAiEnhancer {
  enhance(input: {
    context: PerformanceAnalysisContext;
    ruleBasedPlainText: string;
    promptContext: string;
  }): Promise<string>;
}

/** 默认：直接返回规则引擎文案，不调用外部 API */
export const passthroughPerformanceAnalysisAiEnhancer: PerformanceAnalysisAiEnhancer =
  {
    async enhance({ ruleBasedPlainText }) {
      return ruleBasedPlainText;
    },
  };
