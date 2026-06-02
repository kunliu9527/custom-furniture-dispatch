import {
  AGGREGATE_TABLE_FOOTNOTE,
  FLOW_TABLE_FOOTNOTE,
} from "./metric-display-labels";

/** 绩效 / 贡献榜算法说明（表头、脚注统一文案） */

export const DISPATCHER_CONTRIBUTION_FORMULA =
  "贡献分 = 定金×0.4 + 签约额×0.3 + 下单额×0.15 + 前置交定×200 − 退单预算×0.3 − 签约超时×50（+ 前置交定阶梯加分）";

export const DESIGNER_CONTRIBUTION_FORMULA =
  "贡献分 = 下单额 + 增补×0.8 − 售后×1.2 − 退单额×0.5 − 超时×3000";

export const ROLE_COMPOSITE_WEIGHTS =
  "综合分 = 产值×权重 + 效率×权重 + 质量×权重；派单人 80/15/5 · 设计师 65/15/20 · 安装师 0/30/70";

export const STORE_VALUE_FORMULA =
  "价值分 = 总订单额与已下单量在样本内归一化后按 55/45 加权";

export const STORE_COMPOSITE_FORMULA =
  "门店综合 = 价值分×68% + 质量分×32%；质量分扣待退单量/已退单量/售后";

export const EVALUATION_AMOUNT_RULES = AGGREGATE_TABLE_FOOTNOTE;

export const EVALUATION_RANKING_RULES =
  "数量名次/金额名次并列共享；第1名红旗 · 第2名紫旗 · 退单量不参与排名";

export const DESIGNER_EXTENDED_RANK_RULES =
  "转化率 = 已下单量÷合计 · 平均下单额 = 已下单量÷已下单笔数 · 扩展指标按数值从高到低排名";

export const FLOW_EVALUATION_RULES = FLOW_TABLE_FOOTNOTE;

export const PERSON_RATING_RANKING =
  "按已验收订单客户评星算术均分降序；无电子验收默认 4 星，不计差评；综合低于 3 星记综合差评";

export const DISPATCHER_TOP5_RULE =
  `${DISPATCHER_CONTRIBUTION_FORMULA}；按贡献分降序取前 5`;

export const DESIGNER_PERFORMANCE_RANK_TABS =
  "默认按贡献分排序；可切换已下单量、周期效率（均出图/均总周期）、质量（超时+退单）";
