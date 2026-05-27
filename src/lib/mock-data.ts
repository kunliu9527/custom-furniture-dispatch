import type { Order } from "./types";

/** 来自 2026直营门店设计订单状态.pdf 导入 */
export const INITIAL_ORDERS: Order[] = [
  {
    "id": "ord-0001",
    "customerName": "国辰府23栋2单元205",
    "phone": "—",
    "address": "国辰府23栋2单元205",
    "spaces": [
      "全屋"
    ],
    "budget": 37188,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "待退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "待退单",
        "text": "价格过高",
        "at": "2026-01-01T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0002",
    "customerName": "康桥悦城6-1-1001",
    "phone": "—",
    "address": "康桥悦城6-1-1001",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0003",
    "customerName": "明珠苑6栋二单元1106",
    "phone": "—",
    "address": "明珠苑6栋二单元1106",
    "spaces": [
      "全屋"
    ],
    "budget": 52000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0004",
    "customerName": "马王堆陶瓷城B5栋3楼301",
    "phone": "—",
    "address": "马王堆陶瓷城B5栋3楼301",
    "spaces": [
      "全屋"
    ],
    "budget": 25000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0005",
    "customerName": "万科半岛国际8栋302",
    "phone": "—",
    "address": "万科半岛国际8栋302",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "价格高了/板变柜姚水平",
        "at": "2026-01-05T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0006",
    "customerName": "五矿春和景园40-1603",
    "phone": "—",
    "address": "五矿春和景园40-1603",
    "spaces": [
      "全屋"
    ],
    "budget": 49800,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 49800,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0007",
    "customerName": "京盛和府5栋2303",
    "phone": "—",
    "address": "京盛和府5栋2303",
    "spaces": [
      "全屋"
    ],
    "budget": 45896,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 45896,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0008",
    "customerName": "天镜星城6栋1203",
    "phone": "—",
    "address": "天镜星城6栋1203",
    "spaces": [
      "全屋"
    ],
    "budget": 26500,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 26500,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0009",
    "customerName": "杜鹃路万达商业广场A座817",
    "phone": "—",
    "address": "杜鹃路万达商业广场A座817",
    "spaces": [
      "全屋"
    ],
    "budget": 2716,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 2716,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已下单",
        "text": "李梅申请免费上样",
        "at": "2026-01-09T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-09T16:00:00.000Z"
  },
  {
    "id": "ord-0010",
    "customerName": "绿雅园1栋2单元704",
    "phone": "—",
    "address": "绿雅园1栋2单元704",
    "spaces": [
      "全屋"
    ],
    "budget": 17500,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 17500,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0011",
    "customerName": "美的云樾9栋404",
    "phone": "—",
    "address": "美的云樾9栋404",
    "spaces": [
      "全屋"
    ],
    "budget": 50000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "价格高了/板变柜唐杏平",
        "at": "2026-01-11T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0012",
    "customerName": "金茂麓景苑2栋804",
    "phone": "—",
    "address": "金茂麓景苑2栋804",
    "spaces": [
      "全屋"
    ],
    "budget": 62150,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 62150,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0013",
    "customerName": "雨花区丰升德润12栋1单元201",
    "phone": "—",
    "address": "雨花区丰升德润12栋1单元201",
    "spaces": [
      "全屋"
    ],
    "budget": 23100,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 23100,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "伏迪胜",
    "designer": "伏迪胜",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0014",
    "customerName": "龙湖青云阙5-1204",
    "phone": "—",
    "address": "龙湖青云阙5-1204",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0015",
    "customerName": "三一街区18栋2101",
    "phone": "—",
    "address": "三一街区18栋2101",
    "spaces": [
      "全屋"
    ],
    "budget": 24000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 24000,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0016",
    "customerName": "八方小区D区长房和园3栋1402#",
    "phone": "—",
    "address": "八方小区D区长房和园3栋1402#",
    "spaces": [
      "全屋"
    ],
    "budget": 39568,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 39568,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0017",
    "customerName": "华远碧桂园海蓝城2栋504",
    "phone": "—",
    "address": "华远碧桂园海蓝城2栋504",
    "spaces": [
      "全屋"
    ],
    "budget": 51031,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 51031,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0018",
    "customerName": "国宸府23-1703",
    "phone": "—",
    "address": "国宸府23-1703",
    "spaces": [
      "全屋"
    ],
    "budget": 52500,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 52500,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-18T16:00:00.000Z"
  },
  {
    "id": "ord-0019",
    "customerName": "国宸府三期27-13A03",
    "phone": "—",
    "address": "国宸府三期27-13A03",
    "spaces": [
      "全屋"
    ],
    "budget": 42000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 42000,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-19T16:00:00.000Z"
  },
  {
    "id": "ord-0020",
    "customerName": "建发观悦15栋1单元103",
    "phone": "—",
    "address": "建发观悦15栋1单元103",
    "spaces": [
      "全屋"
    ],
    "budget": 31938,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 31938,
    "afterSalesAmount": null,
    "dispatcherName": "石薇",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-20T16:00:00.000Z"
  },
  {
    "id": "ord-0021",
    "customerName": "7栋1001",
    "phone": "—",
    "address": "7栋1001",
    "spaces": [
      "全屋"
    ],
    "budget": 46000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 46000,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-21T16:00:00.000Z"
  },
  {
    "id": "ord-0022",
    "customerName": "欧洲城6栋2单元1504",
    "phone": "—",
    "address": "欧洲城6栋2单元1504",
    "spaces": [
      "全屋"
    ],
    "budget": 56913,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 56913,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-22T16:00:00.000Z"
  },
  {
    "id": "ord-0023",
    "customerName": "湘江东苑1栋202",
    "phone": "—",
    "address": "湘江东苑1栋202",
    "spaces": [
      "全屋"
    ],
    "budget": 18000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 18000,
    "afterSalesAmount": null,
    "dispatcherName": "石薇",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-23T16:00:00.000Z"
  },
  {
    "id": "ord-0024",
    "customerName": "湘路家园39栋102",
    "phone": "—",
    "address": "湘路家园39栋102",
    "spaces": [
      "全屋"
    ],
    "budget": 50000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 50000,
    "afterSalesAmount": null,
    "dispatcherName": "杨金林",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-24T16:00:00.000Z"
  },
  {
    "id": "ord-0025",
    "customerName": "美的云璟5栋2103",
    "phone": "—",
    "address": "美的云璟5栋2103",
    "spaces": [
      "全屋"
    ],
    "budget": 45000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 45000,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-25T16:00:00.000Z"
  },
  {
    "id": "ord-0026",
    "customerName": "美的云璟7-302",
    "phone": "—",
    "address": "美的云璟7-302",
    "spaces": [
      "全屋"
    ],
    "budget": 34000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 34000,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-26T16:00:00.000Z"
  },
  {
    "id": "ord-0027",
    "customerName": "美的麓府9栋2单元1303",
    "phone": "—",
    "address": "美的麓府9栋2单元1303",
    "spaces": [
      "全屋"
    ],
    "budget": 24084,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 24084,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-27T16:00:00.000Z"
  },
  {
    "id": "ord-0028",
    "customerName": "融创上东区12栋2006",
    "phone": "—",
    "address": "融创上东区12栋2006",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 35000,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2025-12-31T16:00:00.000Z"
  },
  {
    "id": "ord-0029",
    "customerName": "阳光城愉景苑4-1201",
    "phone": "—",
    "address": "阳光城愉景苑4-1201",
    "spaces": [
      "全屋"
    ],
    "budget": 18213,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 18213,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0030",
    "customerName": "龙湖云和颂9-1301",
    "phone": "—",
    "address": "龙湖云和颂9-1301",
    "spaces": [
      "全屋"
    ],
    "budget": 24280,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 24280,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0031",
    "customerName": "万科璞悦湾17栋801",
    "phone": "—",
    "address": "万科璞悦湾17栋801",
    "spaces": [
      "全屋"
    ],
    "budget": 57000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "价格高了，不退定金，转不了单",
        "at": "2026-01-03T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0032",
    "customerName": "汇金城3期2栋705",
    "phone": "—",
    "address": "汇金城3期2栋705",
    "spaces": [
      "全屋"
    ],
    "budget": 62000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "已设计价格高退单",
        "at": "2026-01-04T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0033",
    "customerName": "银盘路领御大厦919号",
    "phone": "—",
    "address": "银盘路领御大厦919号",
    "spaces": [
      "全屋"
    ],
    "budget": 18000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "未量尺等通知",
        "at": "2026-01-05T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0034",
    "customerName": "长沙瑞府3期6栋2704",
    "phone": "—",
    "address": "长沙瑞府3期6栋2704",
    "spaces": [
      "全屋"
    ],
    "budget": 30000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "江庆华",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "待复尺明年交房",
        "at": "2026-01-06T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0035",
    "customerName": "万科璞悦湾5栋601",
    "phone": "—",
    "address": "万科璞悦湾5栋601",
    "spaces": [
      "全屋"
    ],
    "budget": 150000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "待退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "待退单",
        "text": "价格高了",
        "at": "2026-01-07T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0036",
    "customerName": "东门尚苑7-407",
    "phone": "—",
    "address": "东门尚苑7-407",
    "spaces": [
      "全屋"
    ],
    "budget": 45600,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 45600,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0037",
    "customerName": "中交凤鸣九章13栋2单元2203",
    "phone": "—",
    "address": "中交凤鸣九章13栋2单元2203",
    "spaces": [
      "全屋"
    ],
    "budget": 28000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 28000,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-09T16:00:00.000Z"
  },
  {
    "id": "ord-0038",
    "customerName": "公园一号67-101",
    "phone": "—",
    "address": "公园一号67-101",
    "spaces": [
      "全屋"
    ],
    "budget": 100000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0039",
    "customerName": "2区2栋3604",
    "phone": "—",
    "address": "2区2栋3604",
    "spaces": [
      "全屋"
    ],
    "budget": 44000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 44000,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0040",
    "customerName": "君合天玺3栋2701",
    "phone": "—",
    "address": "君合天玺3栋2701",
    "spaces": [
      "全屋"
    ],
    "budget": 28000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "木工打柜子了/板变柜吴璇",
        "at": "2026-01-12T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0041",
    "customerName": "建发悦府3栋1205",
    "phone": "—",
    "address": "建发悦府3栋1205",
    "spaces": [
      "全屋"
    ],
    "budget": 31000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 31000,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0042",
    "customerName": "梅溪森境雅园D13栋102",
    "phone": "—",
    "address": "梅溪森境雅园D13栋102",
    "spaces": [
      "全屋"
    ],
    "budget": 80000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "待量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "待量尺",
        "text": "木工打柜子了",
        "at": "2026-01-14T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0043",
    "customerName": "梦想凤栖台5栋1202",
    "phone": "—",
    "address": "梦想凤栖台5栋1202",
    "spaces": [
      "全屋"
    ],
    "budget": 80000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0044",
    "customerName": "湘江世纪城8-1002",
    "phone": "—",
    "address": "湘江世纪城8-1002",
    "spaces": [
      "全屋"
    ],
    "budget": 31700,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 31700,
    "afterSalesAmount": null,
    "dispatcherName": "江庆华",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0045",
    "customerName": "玖洲观澜16栋902",
    "phone": "—",
    "address": "玖洲观澜16栋902",
    "spaces": [
      "全屋"
    ],
    "budget": 58000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 58000,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0046",
    "customerName": "舜山府20栋801",
    "phone": "—",
    "address": "舜山府20栋801",
    "spaces": [
      "全屋"
    ],
    "budget": 100600,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 100600,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-18T16:00:00.000Z"
  },
  {
    "id": "ord-0047",
    "customerName": "荷花路地税一分局宿舍3栋2单元503",
    "phone": "—",
    "address": "荷花路地税一分局宿舍3栋2单元503",
    "spaces": [
      "全屋"
    ],
    "budget": 65600,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 65600,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-19T16:00:00.000Z"
  },
  {
    "id": "ord-0048",
    "customerName": "质监家属院2栋2单元602",
    "phone": "—",
    "address": "质监家属院2栋2单元602",
    "spaces": [
      "全屋"
    ],
    "budget": 25600,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 25600,
    "afterSalesAmount": null,
    "dispatcherName": "江庆华",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-20T16:00:00.000Z"
  },
  {
    "id": "ord-0049",
    "customerName": "运达会展湾3期4栋902",
    "phone": "—",
    "address": "运达会展湾3期4栋902",
    "spaces": [
      "全屋"
    ],
    "budget": 13000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 13000,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-21T16:00:00.000Z"
  },
  {
    "id": "ord-0050",
    "customerName": "金碧文华12栋2单元319",
    "phone": "—",
    "address": "金碧文华12栋2单元319",
    "spaces": [
      "全屋"
    ],
    "budget": 21000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 21000,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-22T16:00:00.000Z"
  },
  {
    "id": "ord-0051",
    "customerName": "长房东郡1栋2单元1103",
    "phone": "—",
    "address": "长房东郡1栋2单元1103",
    "spaces": [
      "全屋"
    ],
    "budget": 11900,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 11900,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-23T16:00:00.000Z"
  },
  {
    "id": "ord-0052",
    "customerName": "长沙瑞府5栋2202",
    "phone": "—",
    "address": "长沙瑞府5栋2202",
    "spaces": [
      "全屋"
    ],
    "budget": 46000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 46000,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-24T16:00:00.000Z"
  },
  {
    "id": "ord-0053",
    "customerName": "龙湖云河颂12栋802",
    "phone": "—",
    "address": "龙湖云河颂12栋802",
    "spaces": [
      "全屋"
    ],
    "budget": 13448,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 13448,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-25T16:00:00.000Z"
  },
  {
    "id": "ord-0054",
    "customerName": "龙湖青云阙3栋2404",
    "phone": "—",
    "address": "龙湖青云阙3栋2404",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "李炜浪",
    "designer": "李炜浪",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "其他原因",
        "at": "2026-01-26T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-26T16:00:00.000Z"
  },
  {
    "id": "ord-0055",
    "customerName": "天园假日2栋801刘姐",
    "phone": "—",
    "address": "天园假日2栋801刘姐",
    "spaces": [
      "全屋"
    ],
    "budget": 150000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-27T16:00:00.000Z"
  },
  {
    "id": "ord-0056",
    "customerName": "润和星河玥6-1201",
    "phone": "—",
    "address": "润和星河玥6-1201",
    "spaces": [
      "全屋"
    ],
    "budget": 37000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2025-12-31T16:00:00.000Z"
  },
  {
    "id": "ord-0057",
    "customerName": "金辉优步星樾12栋605（刘总）",
    "phone": "—",
    "address": "金辉优步星樾12栋605（刘总）",
    "spaces": [
      "全屋"
    ],
    "budget": 30000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0058",
    "customerName": "上置绿洲雅宾利1-2204",
    "phone": "—",
    "address": "上置绿洲雅宾利1-2204",
    "spaces": [
      "全屋"
    ],
    "budget": 46600,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 46600,
    "afterSalesAmount": 60,
    "dispatcherName": "盛慧",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0059",
    "customerName": "中海阅湘台11栋",
    "phone": "—",
    "address": "中海阅湘台11栋",
    "spaces": [
      "全屋"
    ],
    "budget": 160000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "客户已定其他品牌",
        "at": "2026-01-03T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0060",
    "customerName": "中海阅麓山二期24-202",
    "phone": "—",
    "address": "中海阅麓山二期24-202",
    "spaces": [
      "全屋"
    ],
    "budget": 37800,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 37800,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0061",
    "customerName": "兴进珺府3栋1402",
    "phone": "—",
    "address": "兴进珺府3栋1402",
    "spaces": [
      "全屋"
    ],
    "budget": 15000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 15000,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0062",
    "customerName": "岳阳汨罗大荆镇自建别墅颜姐",
    "phone": "—",
    "address": "岳阳汨罗大荆镇自建别墅颜姐",
    "spaces": [
      "全屋"
    ],
    "budget": 46800,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 46800,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0063",
    "customerName": "开福区金源府MOMA3栋2104",
    "phone": "—",
    "address": "开福区金源府MOMA3栋2104",
    "spaces": [
      "全屋"
    ],
    "budget": 20528,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 20528,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0064",
    "customerName": "日盛滨湖悦府10-501",
    "phone": "—",
    "address": "日盛滨湖悦府10-501",
    "spaces": [
      "全屋"
    ],
    "budget": 51800,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0065",
    "customerName": "桂语云著3栋二单元1404",
    "phone": "—",
    "address": "桂语云著3栋二单元1404",
    "spaces": [
      "全屋"
    ],
    "budget": 30000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-09T16:00:00.000Z"
  },
  {
    "id": "ord-0066",
    "customerName": "美的云樾2栋1901",
    "phone": "—",
    "address": "美的云樾2栋1901",
    "spaces": [
      "全屋"
    ],
    "budget": 6000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 6000,
    "afterSalesAmount": null,
    "dispatcherName": "石薇",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0067",
    "customerName": "美的云璟6栋1003",
    "phone": "—",
    "address": "美的云璟6栋1003",
    "spaces": [
      "全屋"
    ],
    "budget": 48300,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 48300,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0068",
    "customerName": "美的麓府8-501",
    "phone": "—",
    "address": "美的麓府8-501",
    "spaces": [
      "全屋"
    ],
    "budget": 27931,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 27931,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0069",
    "customerName": "荣悦台A座1612",
    "phone": "—",
    "address": "荣悦台A座1612",
    "spaces": [
      "全屋"
    ],
    "budget": 12000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0070",
    "customerName": "辉煌国际城三期6-2202",
    "phone": "—",
    "address": "辉煌国际城三期6-2202",
    "spaces": [
      "全屋"
    ],
    "budget": 29250,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 29250,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0071",
    "customerName": "辉煌国际城二期6栋2502",
    "phone": "—",
    "address": "辉煌国际城二期6栋2502",
    "spaces": [
      "全屋"
    ],
    "budget": 9560,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 9560,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0072",
    "customerName": "长沙瑞府2期5栋702",
    "phone": "—",
    "address": "长沙瑞府2期5栋702",
    "spaces": [
      "全屋"
    ],
    "budget": 42000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 42000,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "练汪理",
    "designer": "练汪理",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0073",
    "customerName": "华实领峯2-3003",
    "phone": "—",
    "address": "华实领峯2-3003",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0074",
    "customerName": "明昱东方B5-704黄文",
    "phone": "—",
    "address": "明昱东方B5-704黄文",
    "spaces": [
      "全屋"
    ],
    "budget": 45000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-18T16:00:00.000Z"
  },
  {
    "id": "ord-0075",
    "customerName": "桃李九章5栋1102，汤老师",
    "phone": "—",
    "address": "桃李九章5栋1102，汤老师",
    "spaces": [
      "全屋"
    ],
    "budget": 250000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-19T16:00:00.000Z"
  },
  {
    "id": "ord-0076",
    "customerName": "英才园3片11栋102号",
    "phone": "—",
    "address": "英才园3片11栋102号",
    "spaces": [
      "全屋"
    ],
    "budget": 60000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-20T16:00:00.000Z"
  },
  {
    "id": "ord-0077",
    "customerName": "高桥壹品2栋3104",
    "phone": "—",
    "address": "高桥壹品2栋3104",
    "spaces": [
      "全屋"
    ],
    "budget": 37800,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-21T16:00:00.000Z"
  },
  {
    "id": "ord-0078",
    "customerName": "鸿运佳苑5栋1303（申想）",
    "phone": "—",
    "address": "鸿运佳苑5栋1303（申想）",
    "spaces": [
      "全屋"
    ],
    "budget": 13000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-22T16:00:00.000Z"
  },
  {
    "id": "ord-0079",
    "customerName": "中交凤鸣东方7栋801",
    "phone": "—",
    "address": "中交凤鸣东方7栋801",
    "spaces": [
      "全屋"
    ],
    "budget": 92000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 92000,
    "afterSalesAmount": null,
    "dispatcherName": "石薇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-23T16:00:00.000Z"
  },
  {
    "id": "ord-0080",
    "customerName": "中航城2-6-204单宁",
    "phone": "—",
    "address": "中航城2-6-204单宁",
    "spaces": [
      "全屋"
    ],
    "budget": 46800,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 46800,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-24T16:00:00.000Z"
  },
  {
    "id": "ord-0081",
    "customerName": "向江徕5栋1703",
    "phone": "—",
    "address": "向江徕5栋1703",
    "spaces": [
      "全屋"
    ],
    "budget": 36000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 36000,
    "afterSalesAmount": null,
    "dispatcherName": "石薇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-25T16:00:00.000Z"
  },
  {
    "id": "ord-0082",
    "customerName": "国藩苑3-3102（娄底双峰）",
    "phone": "—",
    "address": "国藩苑3-3102（娄底双峰）",
    "spaces": [
      "全屋"
    ],
    "budget": 200000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-26T16:00:00.000Z"
  },
  {
    "id": "ord-0083",
    "customerName": "时代倾城二期10栋203",
    "phone": "—",
    "address": "时代倾城二期10栋203",
    "spaces": [
      "全屋"
    ],
    "budget": 21180,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-27T16:00:00.000Z"
  },
  {
    "id": "ord-0084",
    "customerName": "望城区滨江学府1栋2002",
    "phone": "—",
    "address": "望城区滨江学府1栋2002",
    "spaces": [
      "全屋"
    ],
    "budget": 80000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 80000,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2025-12-31T16:00:00.000Z"
  },
  {
    "id": "ord-0085",
    "customerName": "深业睿城G1栋2401",
    "phone": "—",
    "address": "深业睿城G1栋2401",
    "spaces": [
      "全屋"
    ],
    "budget": 43777,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 43777,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0086",
    "customerName": "碧桂园·阅山境9栋2单元504",
    "phone": "—",
    "address": "碧桂园·阅山境9栋2单元504",
    "spaces": [
      "全屋"
    ],
    "budget": 48500,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 48500,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0087",
    "customerName": "美的云樾15-304",
    "phone": "—",
    "address": "美的云樾15-304",
    "spaces": [
      "全屋"
    ],
    "budget": 58000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0088",
    "customerName": "美的云璟5栋1602",
    "phone": "—",
    "address": "美的云璟5栋1602",
    "spaces": [
      "全屋"
    ],
    "budget": 25555,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 25555,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0089",
    "customerName": "6栋501",
    "phone": "—",
    "address": "6栋501",
    "spaces": [
      "全屋"
    ],
    "budget": 15000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 15000,
    "afterSalesAmount": null,
    "dispatcherName": "石薇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0090",
    "customerName": "长沙县青山铺镇洪河村砖屋里组208",
    "phone": "—",
    "address": "长沙县青山铺镇洪河村砖屋里组208",
    "spaces": [
      "全屋"
    ],
    "budget": 29500,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 29500,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0091",
    "customerName": "高桥现代商贸城二栋二单元906",
    "phone": "—",
    "address": "高桥现代商贸城二栋二单元906",
    "spaces": [
      "全屋"
    ],
    "budget": 50000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0092",
    "customerName": "龙湖天璞18-103（雷美娟）",
    "phone": "—",
    "address": "龙湖天璞18-103（雷美娟）",
    "spaces": [
      "全屋"
    ],
    "budget": 54000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 54000,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "刘鑫",
    "designer": "刘鑫",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0094",
    "customerName": "云顶梅溪湖6期18栋3005#",
    "phone": "—",
    "address": "云顶梅溪湖6期18栋3005#",
    "spaces": [
      "全屋"
    ],
    "budget": 77000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 77000,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0095",
    "customerName": "保利梅溪天郡B2-3401",
    "phone": "—",
    "address": "保利梅溪天郡B2-3401",
    "spaces": [
      "全屋"
    ],
    "budget": 25800,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 25800,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0096",
    "customerName": "保利西海岸A1栋3303号",
    "phone": "—",
    "address": "保利西海岸A1栋3303号",
    "spaces": [
      "全屋"
    ],
    "budget": 115509,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 115509,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0097",
    "customerName": "北控浩瀚2-1702#",
    "phone": "—",
    "address": "北控浩瀚2-1702#",
    "spaces": [
      "全屋"
    ],
    "budget": 26000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 26000,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0098",
    "customerName": "奥园城市天骄2期3栋601#",
    "phone": "—",
    "address": "奥园城市天骄2期3栋601#",
    "spaces": [
      "全屋"
    ],
    "budget": 30206,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 30206,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0099",
    "customerName": "岳麓区丽枫酒店旁电梯13014",
    "phone": "—",
    "address": "岳麓区丽枫酒店旁电梯13014",
    "spaces": [
      "全屋"
    ],
    "budget": 44132,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 44132,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0100",
    "customerName": "岳麓区栖山悦府15栋902",
    "phone": "—",
    "address": "岳麓区栖山悦府15栋902",
    "spaces": [
      "全屋"
    ],
    "budget": 75000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 75000,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0101",
    "customerName": "建发缦云5-2902",
    "phone": "—",
    "address": "建发缦云5-2902",
    "spaces": [
      "全屋"
    ],
    "budget": 69255,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 69255,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0102",
    "customerName": "建发缦云6-2301",
    "phone": "—",
    "address": "建发缦云6-2301",
    "spaces": [
      "全屋"
    ],
    "budget": 56800,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 56800,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-18T16:00:00.000Z"
  },
  {
    "id": "ord-0103",
    "customerName": "恒大珺悦府A-4436#",
    "phone": "—",
    "address": "恒大珺悦府A-4436#",
    "spaces": [
      "全屋"
    ],
    "budget": 32988,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 32988,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-19T16:00:00.000Z"
  },
  {
    "id": "ord-0104",
    "customerName": "梅溪正荣府20栋604",
    "phone": "—",
    "address": "梅溪正荣府20栋604",
    "spaces": [
      "全屋"
    ],
    "budget": 83000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-20T16:00:00.000Z"
  },
  {
    "id": "ord-0105",
    "customerName": "梅溪湖玺悦4-1802",
    "phone": "—",
    "address": "梅溪湖玺悦4-1802",
    "spaces": [
      "全屋"
    ],
    "budget": 48031,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 48031,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-21T16:00:00.000Z"
  },
  {
    "id": "ord-0106",
    "customerName": "梦想中央公园9-2401",
    "phone": "—",
    "address": "梦想中央公园9-2401",
    "spaces": [
      "全屋"
    ],
    "budget": 69997,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 69997,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-22T16:00:00.000Z"
  },
  {
    "id": "ord-0107",
    "customerName": "梦想中央公园9栋2401",
    "phone": "—",
    "address": "梦想中央公园9栋2401",
    "spaces": [
      "全屋"
    ],
    "budget": 37000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 37000,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-23T16:00:00.000Z"
  },
  {
    "id": "ord-0108",
    "customerName": "汉唐世家二期11-601",
    "phone": "—",
    "address": "汉唐世家二期11-601",
    "spaces": [
      "全屋"
    ],
    "budget": 17225,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 17225,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-24T16:00:00.000Z"
  },
  {
    "id": "ord-0109",
    "customerName": "湘江世纪城望江苑6冬1301",
    "phone": "—",
    "address": "湘江世纪城望江苑6冬1301",
    "spaces": [
      "全屋"
    ],
    "budget": 60000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-25T16:00:00.000Z"
  },
  {
    "id": "ord-0110",
    "customerName": "湘江天地11-1001",
    "phone": "—",
    "address": "湘江天地11-1001",
    "spaces": [
      "全屋"
    ],
    "budget": 85000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 85000,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-26T16:00:00.000Z"
  },
  {
    "id": "ord-0111",
    "customerName": "美的云璟10-601",
    "phone": "—",
    "address": "美的云璟10-601",
    "spaces": [
      "全屋"
    ],
    "budget": 26000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 26000,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-27T16:00:00.000Z"
  },
  {
    "id": "ord-0112",
    "customerName": "龙湖-云和颂8栋2402（2）",
    "phone": "—",
    "address": "龙湖-云和颂8栋2402（2）",
    "spaces": [
      "全屋"
    ],
    "budget": 78000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 78000,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2025-12-31T16:00:00.000Z"
  },
  {
    "id": "ord-0113",
    "customerName": "龙湖-云河颂8栋2402",
    "phone": "—",
    "address": "龙湖-云河颂8栋2402",
    "spaces": [
      "全屋"
    ],
    "budget": 156000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 156000,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0114",
    "customerName": "佳兆业城市广场6栋903",
    "phone": "—",
    "address": "佳兆业城市广场6栋903",
    "spaces": [
      "全屋"
    ],
    "budget": 80000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "已设计价格退单",
        "at": "2026-01-02T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0115",
    "customerName": "三王丽都东座910",
    "phone": "—",
    "address": "三王丽都东座910",
    "spaces": [
      "全屋"
    ],
    "budget": 14400,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 14400,
    "afterSalesAmount": 98,
    "dispatcherName": "帅菊元",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0116",
    "customerName": "中海寰宇天下26栋703",
    "phone": "—",
    "address": "中海寰宇天下26栋703",
    "spaces": [
      "全屋"
    ],
    "budget": 40300,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 40300,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0117",
    "customerName": "丽发新城B2栋404",
    "phone": "—",
    "address": "丽发新城B2栋404",
    "spaces": [
      "全屋"
    ],
    "budget": 41800,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 41800,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0118",
    "customerName": "5栋2203",
    "phone": "—",
    "address": "5栋2203",
    "spaces": [
      "全屋"
    ],
    "budget": 25000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 25000,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0119",
    "customerName": "名都花园18栋C座811",
    "phone": "—",
    "address": "名都花园18栋C座811",
    "spaces": [
      "全屋"
    ],
    "budget": 14000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0120",
    "customerName": "恒大雅苑1栋1单元1103",
    "phone": "—",
    "address": "恒大雅苑1栋1单元1103",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "江庆华",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "已设计价格问题退单",
        "at": "2026-01-08T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0121",
    "customerName": "格林香山4栋1505",
    "phone": "—",
    "address": "格林香山4栋1505",
    "spaces": [
      "全屋"
    ],
    "budget": 30000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "已设计价格退单/板变柜李梅",
        "at": "2026-01-09T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-09T16:00:00.000Z"
  },
  {
    "id": "ord-0122",
    "customerName": "楚天御府F2栋2601",
    "phone": "—",
    "address": "楚天御府F2栋2601",
    "spaces": [
      "全屋"
    ],
    "budget": 41800,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 41800,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0123",
    "customerName": "澳海观澜府16栋1701",
    "phone": "—",
    "address": "澳海观澜府16栋1701",
    "spaces": [
      "全屋"
    ],
    "budget": 56000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "已设计价格退单/板变柜李梅",
        "at": "2026-01-11T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0124",
    "customerName": "金地兰亭樾2栋2703",
    "phone": "—",
    "address": "金地兰亭樾2栋2703",
    "spaces": [
      "全屋"
    ],
    "budget": 20360,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 20360,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0125",
    "customerName": "银盘鑫城1栋1204",
    "phone": "—",
    "address": "银盘鑫城1栋1204",
    "spaces": [
      "全屋"
    ],
    "budget": 24000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0126",
    "customerName": "雅致名园4栋1204",
    "phone": "—",
    "address": "雅致名园4栋1204",
    "spaces": [
      "全屋"
    ],
    "budget": 57000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "帅菊元",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0127",
    "customerName": "长房明宸府8栋2单元705",
    "phone": "—",
    "address": "长房明宸府8栋2单元705",
    "spaces": [
      "全屋"
    ],
    "budget": 41000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0128",
    "customerName": "长沙北中心保利时代J区2-1302",
    "phone": "—",
    "address": "长沙北中心保利时代J区2-1302",
    "spaces": [
      "全屋"
    ],
    "budget": 25000,
    "dispatchStore": "高桥天冠",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "江庆华",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "前置量房已设计价格问题未下定",
        "at": "2026-01-16T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0129",
    "customerName": "中海阅溪府16-2902",
    "phone": "—",
    "address": "中海阅溪府16-2902",
    "spaces": [
      "全屋"
    ],
    "budget": 30000,
    "dispatchStore": "高桥天冠",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "江庆华",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "前置量房已设计价格问题未下定",
        "at": "2026-01-17T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0130",
    "customerName": "金色溪泉湾A5-1501",
    "phone": "—",
    "address": "金色溪泉湾A5-1501",
    "spaces": [
      "全屋"
    ],
    "budget": 110000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "江庆华",
    "originalDesigner": "罗晨",
    "designer": "罗晨",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已退单",
        "text": "已设计价格转板材",
        "at": "2026-01-18T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-18T16:00:00.000Z"
  },
  {
    "id": "ord-0131",
    "customerName": "万科紫台7栋1003房",
    "phone": "—",
    "address": "万科紫台7栋1003房",
    "spaces": [
      "全屋"
    ],
    "budget": 128654,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 128654,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-19T16:00:00.000Z"
  },
  {
    "id": "ord-0132",
    "customerName": "华杰.福源府1栋602",
    "phone": "—",
    "address": "华杰.福源府1栋602",
    "spaces": [
      "全屋"
    ],
    "budget": 53288,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 53288,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-20T16:00:00.000Z"
  },
  {
    "id": "ord-0133",
    "customerName": "君合新城玺樾7栋1604",
    "phone": "—",
    "address": "君合新城玺樾7栋1604",
    "spaces": [
      "全屋"
    ],
    "budget": 7200,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 7200,
    "afterSalesAmount": null,
    "dispatcherName": "杨金林",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-21T16:00:00.000Z"
  },
  {
    "id": "ord-0134",
    "customerName": "建发缦云8-1501",
    "phone": "—",
    "address": "建发缦云8-1501",
    "spaces": [
      "全屋"
    ],
    "budget": 130000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 130000,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-22T16:00:00.000Z"
  },
  {
    "id": "ord-0135",
    "customerName": "招商蛇口.天青府5-201（雷总）",
    "phone": "—",
    "address": "招商蛇口.天青府5-201（雷总）",
    "spaces": [
      "全屋"
    ],
    "budget": 50000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 50000,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-23T16:00:00.000Z"
  },
  {
    "id": "ord-0136",
    "customerName": "招商蛇口.天青府5-201（雷总2）",
    "phone": "—",
    "address": "招商蛇口.天青府5-201（雷总2）",
    "spaces": [
      "全屋"
    ],
    "budget": 20300,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 20300,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-24T16:00:00.000Z"
  },
  {
    "id": "ord-0137",
    "customerName": "新城新世界A5栋1-1701",
    "phone": "—",
    "address": "新城新世界A5栋1-1701",
    "spaces": [
      "全屋"
    ],
    "budget": 12730,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 12730,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-25T16:00:00.000Z"
  },
  {
    "id": "ord-0138",
    "customerName": "梅溪正荣府7-2101",
    "phone": "—",
    "address": "梅溪正荣府7-2101",
    "spaces": [
      "全屋"
    ],
    "budget": 13532,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 13532,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-26T16:00:00.000Z"
  },
  {
    "id": "ord-0139",
    "customerName": "江山帝景哈佛三期10栋1304#",
    "phone": "—",
    "address": "江山帝景哈佛三期10栋1304#",
    "spaces": [
      "全屋"
    ],
    "budget": 16931,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 16931,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-27T16:00:00.000Z"
  },
  {
    "id": "ord-0140",
    "customerName": "江悦和鸣18-1103",
    "phone": "—",
    "address": "江悦和鸣18-1103",
    "spaces": [
      "全屋"
    ],
    "budget": 61300,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 61300,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2025-12-31T16:00:00.000Z"
  },
  {
    "id": "ord-0141",
    "customerName": "碧水春城一期3-1201",
    "phone": "—",
    "address": "碧水春城一期3-1201",
    "spaces": [
      "全屋"
    ],
    "budget": 64500,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 64500,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0142",
    "customerName": "绿城高尔夫小镇15栋",
    "phone": "—",
    "address": "绿城高尔夫小镇15栋",
    "spaces": [
      "全屋"
    ],
    "budget": 60000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0143",
    "customerName": "长沙悦府6-2-1702",
    "phone": "—",
    "address": "长沙悦府6-2-1702",
    "spaces": [
      "全屋"
    ],
    "budget": 98000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 98000,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0144",
    "customerName": "东方新世界1栋6015",
    "phone": "—",
    "address": "东方新世界1栋6015",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0145",
    "customerName": "中江国际花城4栋1单元402",
    "phone": "—",
    "address": "中江国际花城4栋1单元402",
    "spaces": [
      "全屋"
    ],
    "budget": 17000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 17000,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0146",
    "customerName": "中隆国际御玺7C栋2101房",
    "phone": "—",
    "address": "中隆国际御玺7C栋2101房",
    "spaces": [
      "全屋"
    ],
    "budget": 89800,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 89800,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0147",
    "customerName": "丽发新城四期B6栋2101",
    "phone": "—",
    "address": "丽发新城四期B6栋2101",
    "spaces": [
      "全屋"
    ],
    "budget": 67000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 67000,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0148",
    "customerName": "人民中路86号湘雅二医院劳动村2栋702室",
    "phone": "—",
    "address": "人民中路86号湘雅二医院劳动村2栋702室",
    "spaces": [
      "全屋"
    ],
    "budget": 21800,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 21800,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0149",
    "customerName": "保利金香槟15栋702",
    "phone": "—",
    "address": "保利金香槟15栋702",
    "spaces": [
      "全屋"
    ],
    "budget": 11000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 11000,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-09T16:00:00.000Z"
  },
  {
    "id": "ord-0150",
    "customerName": "兰亭湾畔1期7栋2-1907房",
    "phone": "—",
    "address": "兰亭湾畔1期7栋2-1907房",
    "spaces": [
      "全屋"
    ],
    "budget": 23990,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 23990,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0151",
    "customerName": "南门口鸿信大厦南栋915房",
    "phone": "—",
    "address": "南门口鸿信大厦南栋915房",
    "spaces": [
      "全屋"
    ],
    "budget": 60000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "待退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "待退单",
        "text": "客户停工，出租",
        "at": "2026-01-11T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0152",
    "customerName": "双湾国际8栋1单元1503",
    "phone": "—",
    "address": "双湾国际8栋1单元1503",
    "spaces": [
      "全屋"
    ],
    "budget": 10000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 10000,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0153",
    "customerName": "桂语云峰二期13栋2单元3504房",
    "phone": "—",
    "address": "桂语云峰二期13栋2单元3504房",
    "spaces": [
      "全屋"
    ],
    "budget": 120000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0154",
    "customerName": "41栋",
    "phone": "—",
    "address": "41栋",
    "spaces": [
      "全屋"
    ],
    "budget": 12088,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 12088,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0155",
    "customerName": "玖洲观澜16-803",
    "phone": "—",
    "address": "玖洲观澜16-803",
    "spaces": [
      "全屋"
    ],
    "budget": 75000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0156",
    "customerName": "芙蓉区湘语洺悦2栋401",
    "phone": "—",
    "address": "芙蓉区湘语洺悦2栋401",
    "spaces": [
      "全屋"
    ],
    "budget": 42000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 42000,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0157",
    "customerName": "芙蓉区甲6-306",
    "phone": "—",
    "address": "芙蓉区甲6-306",
    "spaces": [
      "全屋"
    ],
    "budget": 27215,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 27215,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0158",
    "customerName": "融科三万英尺4-203房",
    "phone": "—",
    "address": "融科三万英尺4-203房",
    "spaces": [
      "全屋"
    ],
    "budget": 20000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-18T16:00:00.000Z"
  },
  {
    "id": "ord-0159",
    "customerName": "运达会展湾三期4栋2002周迎总",
    "phone": "—",
    "address": "运达会展湾三期4栋2002周迎总",
    "spaces": [
      "全屋"
    ],
    "budget": 100000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-19T16:00:00.000Z"
  },
  {
    "id": "ord-0160",
    "customerName": "金色溪泉湾西区A18栋601",
    "phone": "—",
    "address": "金色溪泉湾西区A18栋601",
    "spaces": [
      "全屋"
    ],
    "budget": 110000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 110000,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-20T16:00:00.000Z"
  },
  {
    "id": "ord-0161",
    "customerName": "长沙县春华自建别墅",
    "phone": "—",
    "address": "长沙县春华自建别墅",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 40000,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-21T16:00:00.000Z"
  },
  {
    "id": "ord-0162",
    "customerName": "龙湖天璞11栋604",
    "phone": "—",
    "address": "龙湖天璞11栋604",
    "spaces": [
      "全屋"
    ],
    "budget": 70400,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 70400,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-22T16:00:00.000Z"
  },
  {
    "id": "ord-0163",
    "customerName": "平江汨水人家7-701",
    "phone": "—",
    "address": "平江汨水人家7-701",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-23T16:00:00.000Z"
  },
  {
    "id": "ord-0164",
    "customerName": "荷韵园",
    "phone": "—",
    "address": "荷韵园",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "待退单",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "待退单",
        "text": "价格过高",
        "at": "2026-01-24T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-24T16:00:00.000Z"
  },
  {
    "id": "ord-0165",
    "customerName": "凯旋门19-1101",
    "phone": "—",
    "address": "凯旋门19-1101",
    "spaces": [
      "全屋"
    ],
    "budget": 50000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "待退单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-25T16:00:00.000Z"
  },
  {
    "id": "ord-0166",
    "customerName": "松湖天地12-502",
    "phone": "—",
    "address": "松湖天地12-502",
    "spaces": [
      "全屋"
    ],
    "budget": 180000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "钱海霞",
    "designer": "钱海霞",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-26T16:00:00.000Z"
  },
  {
    "id": "ord-0167",
    "customerName": "江山帝景凯盛庭G14/15-902",
    "phone": "—",
    "address": "江山帝景凯盛庭G14/15-902",
    "spaces": [
      "全屋"
    ],
    "budget": 120000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "汤雷",
    "designer": "汤雷",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-27T16:00:00.000Z"
  },
  {
    "id": "ord-0168",
    "customerName": "三一云湖9-301",
    "phone": "—",
    "address": "三一云湖9-301",
    "spaces": [
      "全屋"
    ],
    "budget": 100000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "汤雷",
    "designer": "汤雷",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2025-12-31T16:00:00.000Z"
  },
  {
    "id": "ord-0169",
    "customerName": "三一云谷二期9栋901",
    "phone": "—",
    "address": "三一云谷二期9栋901",
    "spaces": [
      "全屋"
    ],
    "budget": 62000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "汤雷",
    "designer": "汤雷",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0170",
    "customerName": "中建钰和城E18-502",
    "phone": "—",
    "address": "中建钰和城E18-502",
    "spaces": [
      "全屋"
    ],
    "budget": 110000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "汤雷",
    "designer": "汤雷",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "方案已对好等通知复尺",
        "at": "2026-01-02T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0171",
    "customerName": "恒大清澜苑17-202",
    "phone": "—",
    "address": "恒大清澜苑17-202",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "汤雷",
    "designer": "汤雷",
    "transferRecords": [],
    "status": "待量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "待量尺",
        "text": "未拆墙",
        "at": "2026-01-03T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0172",
    "customerName": "润和星河玥6-2406",
    "phone": "—",
    "address": "润和星河玥6-2406",
    "spaces": [
      "全屋"
    ],
    "budget": 30000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "汤雷",
    "designer": "汤雷",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "方案已对好等通知复尺",
        "at": "2026-01-04T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0173",
    "customerName": "牡丹舸8栋1602",
    "phone": "—",
    "address": "牡丹舸8栋1602",
    "spaces": [
      "全屋"
    ],
    "budget": 8000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 8000,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "汤雷",
    "designer": "汤雷",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0174",
    "customerName": "江山帝景G14G15-902",
    "phone": "—",
    "address": "江山帝景G14G15-902",
    "spaces": [
      "全屋"
    ],
    "budget": 120000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "汤雷",
    "designer": "汤雷",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "方案已对好等通知复尺",
        "at": "2026-01-06T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0175",
    "customerName": "岳麓区莱茵城B3栋2102房",
    "phone": "—",
    "address": "岳麓区莱茵城B3栋2102房",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0176",
    "customerName": "望城区时代年华21栋805",
    "phone": "—",
    "address": "望城区时代年华21栋805",
    "spaces": [
      "全屋"
    ],
    "budget": 10000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0177",
    "customerName": "万科森林公园34栋903",
    "phone": "—",
    "address": "万科森林公园34栋903",
    "spaces": [
      "全屋"
    ],
    "budget": 96600,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 96600,
    "afterSalesAmount": null,
    "dispatcherName": "杨金林",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-09T16:00:00.000Z"
  },
  {
    "id": "ord-0178",
    "customerName": "万科白鹭郡20-B-403",
    "phone": "—",
    "address": "万科白鹭郡20-B-403",
    "spaces": [
      "全屋"
    ],
    "budget": 14505,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 14505,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0179",
    "customerName": "2栋3206",
    "phone": "—",
    "address": "2栋3206",
    "spaces": [
      "全屋"
    ],
    "budget": 62000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 62000,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0180",
    "customerName": "9栋1001",
    "phone": "—",
    "address": "9栋1001",
    "spaces": [
      "全屋"
    ],
    "budget": 4400,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 4400,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0181",
    "customerName": "区1栋2501",
    "phone": "—",
    "address": "区1栋2501",
    "spaces": [
      "全屋"
    ],
    "budget": 32800,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 32800,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0182",
    "customerName": "国欣云境府4栋2单元1306",
    "phone": "—",
    "address": "国欣云境府4栋2单元1306",
    "spaces": [
      "全屋"
    ],
    "budget": 53900,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 53900,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0183",
    "customerName": "国欣云境府4栋2单元2205",
    "phone": "—",
    "address": "国欣云境府4栋2单元2205",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 35000,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0184",
    "customerName": "城发恒伟雅郦映A7-805",
    "phone": "—",
    "address": "城发恒伟雅郦映A7-805",
    "spaces": [
      "全屋"
    ],
    "budget": 42391,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 42391,
    "afterSalesAmount": null,
    "dispatcherName": "杨金林",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0185",
    "customerName": "天下一家华府2栋1单元1201",
    "phone": "—",
    "address": "天下一家华府2栋1单元1201",
    "spaces": [
      "全屋"
    ],
    "budget": 27689,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 27689,
    "afterSalesAmount": null,
    "dispatcherName": "杨金林",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0186",
    "customerName": "宁乡朱良桥左家山村自建别墅",
    "phone": "—",
    "address": "宁乡朱良桥左家山村自建别墅",
    "spaces": [
      "全屋"
    ],
    "budget": 88000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 88000,
    "afterSalesAmount": 70,
    "dispatcherName": "曾丹",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-18T16:00:00.000Z"
  },
  {
    "id": "ord-0187",
    "customerName": "建发玖洲和玺21-2-1503",
    "phone": "—",
    "address": "建发玖洲和玺21-2-1503",
    "spaces": [
      "全屋"
    ],
    "budget": 8600,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 8600,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-19T16:00:00.000Z"
  },
  {
    "id": "ord-0188",
    "customerName": "恒大半山悦府163栋604",
    "phone": "—",
    "address": "恒大半山悦府163栋604",
    "spaces": [
      "全屋"
    ],
    "budget": 47000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 47000,
    "afterSalesAmount": null,
    "dispatcherName": "杨金林",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-20T16:00:00.000Z"
  },
  {
    "id": "ord-0189",
    "customerName": "望城中冶1957-8栋1单元1002房",
    "phone": "—",
    "address": "望城中冶1957-8栋1单元1002房",
    "spaces": [
      "全屋"
    ],
    "budget": 46500,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 46500,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-21T16:00:00.000Z"
  },
  {
    "id": "ord-0190",
    "customerName": "梦想中央公园9栋2202",
    "phone": "—",
    "address": "梦想中央公园9栋2202",
    "spaces": [
      "全屋"
    ],
    "budget": 7700,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 7700,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-22T16:00:00.000Z"
  },
  {
    "id": "ord-0191",
    "customerName": "瀚澜湾8栋1002",
    "phone": "—",
    "address": "瀚澜湾8栋1002",
    "spaces": [
      "全屋"
    ],
    "budget": 1700,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 1700,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-23T16:00:00.000Z"
  },
  {
    "id": "ord-0192",
    "customerName": "观山印三期12栋1302#",
    "phone": "—",
    "address": "观山印三期12栋1302#",
    "spaces": [
      "全屋"
    ],
    "budget": 26000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 26000,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-24T16:00:00.000Z"
  },
  {
    "id": "ord-0193",
    "customerName": "轨道万科璞悦湾17栋2403",
    "phone": "—",
    "address": "轨道万科璞悦湾17栋2403",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 40000,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-25T16:00:00.000Z"
  },
  {
    "id": "ord-0194",
    "customerName": "长房云时代7栋102",
    "phone": "—",
    "address": "长房云时代7栋102",
    "spaces": [
      "全屋"
    ],
    "budget": 47200,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 47200,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-26T16:00:00.000Z"
  },
  {
    "id": "ord-0195",
    "customerName": "长沙悦府2b-1101",
    "phone": "—",
    "address": "长沙悦府2b-1101",
    "spaces": [
      "全屋"
    ],
    "budget": 22280,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 22280,
    "afterSalesAmount": null,
    "dispatcherName": "杨金林",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-27T16:00:00.000Z"
  },
  {
    "id": "ord-0196",
    "customerName": "麓枫和苑21栋2单元1105室",
    "phone": "—",
    "address": "麓枫和苑21栋2单元1105室",
    "spaces": [
      "全屋"
    ],
    "budget": 68000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 68000,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2025-12-31T16:00:00.000Z"
  },
  {
    "id": "ord-0197",
    "customerName": "吉泰园A-2-2607",
    "phone": "—",
    "address": "吉泰园A-2-2607",
    "spaces": [
      "全屋"
    ],
    "budget": 30000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0198",
    "customerName": "金奥湘江公馆E3-2201",
    "phone": "—",
    "address": "金奥湘江公馆E3-2201",
    "spaces": [
      "全屋"
    ],
    "budget": 20000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0199",
    "customerName": "钰山府33栋-1305",
    "phone": "—",
    "address": "钰山府33栋-1305",
    "spaces": [
      "全屋"
    ],
    "budget": 30000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "待量尺",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0200",
    "customerName": "湘许嘉园北栋505",
    "phone": "—",
    "address": "湘许嘉园北栋505",
    "spaces": [
      "全屋"
    ],
    "budget": 1000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0201",
    "customerName": "湘江世纪城聚江苑1-2-2102",
    "phone": "—",
    "address": "湘江世纪城聚江苑1-2-2102",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0202",
    "customerName": "绿地麓云国际2-2404",
    "phone": "—",
    "address": "绿地麓云国际2-2404",
    "spaces": [
      "全屋"
    ],
    "budget": 150000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0203",
    "customerName": "省委一区14-206",
    "phone": "—",
    "address": "省委一区14-206",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0204",
    "customerName": "保利梅溪天郡B4-3103",
    "phone": "—",
    "address": "保利梅溪天郡B4-3103",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0205",
    "customerName": "湘江世纪城（板变柜）15-904",
    "phone": "—",
    "address": "湘江世纪城（板变柜）15-904",
    "spaces": [
      "全屋"
    ],
    "budget": 70000,
    "dispatchStore": "郁金香万象",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "前置方案",
        "at": "2026-01-09T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-09T16:00:00.000Z"
  },
  {
    "id": "ord-0206",
    "customerName": "福天藏郡4-1707",
    "phone": "—",
    "address": "福天藏郡4-1707",
    "spaces": [
      "全屋"
    ],
    "budget": 100000,
    "dispatchStore": "郁金香万象",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "前置方案",
        "at": "2026-01-10T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0207",
    "customerName": "东方大院7-104",
    "phone": "—",
    "address": "东方大院7-104",
    "spaces": [
      "全屋"
    ],
    "budget": 150000,
    "dispatchStore": "郁金香万象",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "前置方案",
        "at": "2026-01-11T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0208",
    "customerName": "山瑚郡C4-2602",
    "phone": "—",
    "address": "山瑚郡C4-2602",
    "spaces": [
      "全屋"
    ],
    "budget": 9000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "汤勇",
    "designer": "汤勇",
    "transferRecords": [],
    "status": "已签约",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0209",
    "customerName": "合能枫丹丽舍12栋604",
    "phone": "—",
    "address": "合能枫丹丽舍12栋604",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "停工",
        "at": "2026-01-13T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0210",
    "customerName": "国宸府27-802王淑美",
    "phone": "—",
    "address": "国宸府27-802王淑美",
    "spaces": [
      "全屋"
    ],
    "budget": 32980,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 32980,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0211",
    "customerName": "国宸府27栋1106",
    "phone": "—",
    "address": "国宸府27栋1106",
    "spaces": [
      "全屋"
    ],
    "budget": 60000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0212",
    "customerName": "区2栋303",
    "phone": "—",
    "address": "区2栋303",
    "spaces": [
      "全屋"
    ],
    "budget": 40000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0213",
    "customerName": "金地都会风华14-606（彭雅彬）",
    "phone": "—",
    "address": "金地都会风华14-606（彭雅彬）",
    "spaces": [
      "全屋"
    ],
    "budget": 36000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0214",
    "customerName": "中建钰和城E区15栋3003",
    "phone": "—",
    "address": "中建钰和城E区15栋3003",
    "spaces": [
      "全屋"
    ],
    "budget": 1350,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 1350,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-18T16:00:00.000Z"
  },
  {
    "id": "ord-0215",
    "customerName": "八方小区B区15栋2单元804",
    "phone": "—",
    "address": "八方小区B区15栋2单元804",
    "spaces": [
      "全屋"
    ],
    "budget": 900,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 900,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-19T16:00:00.000Z"
  },
  {
    "id": "ord-0216",
    "customerName": "天园假日小区1栋2单元1407",
    "phone": "—",
    "address": "天园假日小区1栋2单元1407",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-20T16:00:00.000Z"
  },
  {
    "id": "ord-0217",
    "customerName": "富湾国际1栋2702",
    "phone": "—",
    "address": "富湾国际1栋2702",
    "spaces": [
      "全屋"
    ],
    "budget": 150000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-21T16:00:00.000Z"
  },
  {
    "id": "ord-0218",
    "customerName": "岳麓区新兴北京御园二期12栋2单元1304",
    "phone": "—",
    "address": "岳麓区新兴北京御园二期12栋2单元1304",
    "spaces": [
      "全屋"
    ],
    "budget": 52000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-22T16:00:00.000Z"
  },
  {
    "id": "ord-0219",
    "customerName": "怡海星城6栋911房",
    "phone": "—",
    "address": "怡海星城6栋911房",
    "spaces": [
      "全屋"
    ],
    "budget": 4026,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 4026,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-23T16:00:00.000Z"
  },
  {
    "id": "ord-0220",
    "customerName": "揽江院子3栋2004",
    "phone": "—",
    "address": "揽江院子3栋2004",
    "spaces": [
      "全屋"
    ],
    "budget": 42000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-24T16:00:00.000Z"
  },
  {
    "id": "ord-0221",
    "customerName": "湘龙家园跃鳞廊D1-203",
    "phone": "—",
    "address": "湘龙家园跃鳞廊D1-203",
    "spaces": [
      "全屋"
    ],
    "budget": 58000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 58000,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-25T16:00:00.000Z"
  },
  {
    "id": "ord-0222",
    "customerName": "紫华郡19栋1801，肖老师",
    "phone": "—",
    "address": "紫华郡19栋1801，肖老师",
    "spaces": [
      "全屋"
    ],
    "budget": 32000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 32000,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-26T16:00:00.000Z"
  },
  {
    "id": "ord-0223",
    "customerName": "轨道万科璞悦湾5栋703",
    "phone": "—",
    "address": "轨道万科璞悦湾5栋703",
    "spaces": [
      "全屋"
    ],
    "budget": 49500,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 49500,
    "afterSalesAmount": null,
    "dispatcherName": "熊美珍",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-27T16:00:00.000Z"
  },
  {
    "id": "ord-0224",
    "customerName": "金辉优步花园13-1502",
    "phone": "—",
    "address": "金辉优步花园13-1502",
    "spaces": [
      "全屋"
    ],
    "budget": 15035,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": 15035,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2025-12-31T16:00:00.000Z"
  },
  {
    "id": "ord-0225",
    "customerName": "龙湖天璞5-104（鞋柜）",
    "phone": "—",
    "address": "龙湖天璞5-104（鞋柜）",
    "spaces": [
      "全屋"
    ],
    "budget": 10000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已退单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0226",
    "customerName": "龙湖翠湖壹号6-1102",
    "phone": "—",
    "address": "龙湖翠湖壹号6-1102",
    "spaces": [
      "全屋"
    ],
    "budget": 48888,
    "dispatchStore": "高桥天冠",
    "deposit": 1000,
    "orderAmount": 48888,
    "afterSalesAmount": null,
    "dispatcherName": "江庆华",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0227",
    "customerName": "中央洋房B区3-104",
    "phone": "—",
    "address": "中央洋房B区3-104",
    "spaces": [
      "全屋"
    ],
    "budget": 210000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0228",
    "customerName": "桃李九章8-1702",
    "phone": "—",
    "address": "桃李九章8-1702",
    "spaces": [
      "全屋"
    ],
    "budget": 60000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0229",
    "customerName": "龙湖天璞12-1501",
    "phone": "—",
    "address": "龙湖天璞12-1501",
    "spaces": [
      "全屋"
    ],
    "budget": 46800,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "夏丹丹",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已签约",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0230",
    "customerName": "桃李九章7-802",
    "phone": "—",
    "address": "桃李九章7-802",
    "spaces": [
      "全屋"
    ],
    "budget": 86000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "袁环宇",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已签约",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0231",
    "customerName": "高桥一品1-2604",
    "phone": "—",
    "address": "高桥一品1-2604",
    "spaces": [
      "全屋"
    ],
    "budget": 12000,
    "dispatchStore": "东岸天冠",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "前置未定",
        "at": "2026-01-07T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0232",
    "customerName": "美的云璟5栋1501",
    "phone": "—",
    "address": "美的云璟5栋1501",
    "spaces": [
      "全屋"
    ],
    "budget": 80000,
    "dispatchStore": "东岸天冠",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "前置未定",
        "at": "2026-01-08T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0233",
    "customerName": "桃李九章8-1502喻老师",
    "phone": "—",
    "address": "桃李九章8-1502喻老师",
    "spaces": [
      "全屋"
    ],
    "budget": 120000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-09T16:00:00.000Z"
  },
  {
    "id": "ord-0234",
    "customerName": "万境潇湘8栋601",
    "phone": "—",
    "address": "万境潇湘8栋601",
    "spaces": [
      "全屋"
    ],
    "budget": 71000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 71000,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0235",
    "customerName": "万象时代5-1725",
    "phone": "—",
    "address": "万象时代5-1725",
    "spaces": [
      "全屋"
    ],
    "budget": 11300,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 11300,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0236",
    "customerName": "保利和光尘樾9栋603",
    "phone": "—",
    "address": "保利和光尘樾9栋603",
    "spaces": [
      "全屋"
    ],
    "budget": 50000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0237",
    "customerName": "岳麓区黄鹤小区二片11栋4单元2楼",
    "phone": "—",
    "address": "岳麓区黄鹤小区二片11栋4单元2楼",
    "spaces": [
      "全屋"
    ],
    "budget": 8666,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 8666,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0238",
    "customerName": "招商天青府5-201雷总",
    "phone": "—",
    "address": "招商天青府5-201雷总",
    "spaces": [
      "全屋"
    ],
    "budget": 73000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 73000,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0239",
    "customerName": "新城新世界1期B3-1108",
    "phone": "—",
    "address": "新城新世界1期B3-1108",
    "spaces": [
      "全屋"
    ],
    "budget": 32000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 32000,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0240",
    "customerName": "晟通牡丹舸12栋2001",
    "phone": "—",
    "address": "晟通牡丹舸12栋2001",
    "spaces": [
      "全屋"
    ],
    "budget": 6000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 6000,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0241",
    "customerName": "望城区乔口镇曹家岭自建别墅",
    "phone": "—",
    "address": "望城区乔口镇曹家岭自建别墅",
    "spaces": [
      "全屋"
    ],
    "budget": 40500,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已签约",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0242",
    "customerName": "玛依拉山庄3-302#",
    "phone": "—",
    "address": "玛依拉山庄3-302#",
    "spaces": [
      "全屋"
    ],
    "budget": 8000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 8000,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-18T16:00:00.000Z"
  },
  {
    "id": "ord-0243",
    "customerName": "鑫远融泽府7栋1单元1001房",
    "phone": "—",
    "address": "鑫远融泽府7栋1单元1001房",
    "spaces": [
      "全屋"
    ],
    "budget": 50000,
    "dispatchStore": "东岸万象",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周静",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "前置服务",
        "at": "2026-01-19T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-19T16:00:00.000Z"
  },
  {
    "id": "ord-0244",
    "customerName": "长沙如院15栋1001",
    "phone": "—",
    "address": "长沙如院15栋1001",
    "spaces": [
      "全屋"
    ],
    "budget": 38000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": 38000,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-20T16:00:00.000Z"
  },
  {
    "id": "ord-0245",
    "customerName": "万象春樾和景1-304",
    "phone": "—",
    "address": "万象春樾和景1-304",
    "spaces": [
      "全屋"
    ],
    "budget": 50000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "周坤",
    "designer": "周坤",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "初步方案再做对接中",
        "at": "2026-01-21T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-21T16:00:00.000Z"
  },
  {
    "id": "ord-0246",
    "customerName": "丰园城丰荷苑2栋1606房",
    "phone": "—",
    "address": "丰园城丰荷苑2栋1606房",
    "spaces": [
      "全屋"
    ],
    "budget": 9111,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 9111,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "周坤",
    "designer": "周坤",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-22T16:00:00.000Z"
  },
  {
    "id": "ord-0247",
    "customerName": "南山雍江汇1栋2201房",
    "phone": "—",
    "address": "南山雍江汇1栋2201房",
    "spaces": [
      "全屋"
    ],
    "budget": 8300,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 8300,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "周坤",
    "designer": "周坤",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-23T16:00:00.000Z"
  },
  {
    "id": "ord-0248",
    "customerName": "小雨厂坪26号504房",
    "phone": "—",
    "address": "小雨厂坪26号504房",
    "spaces": [
      "全屋"
    ],
    "budget": 30500,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 30500,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "周坤",
    "designer": "周坤",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-24T16:00:00.000Z"
  },
  {
    "id": "ord-0249",
    "customerName": "新城新世界A7栋二单元1008房",
    "phone": "—",
    "address": "新城新世界A7栋二单元1008房",
    "spaces": [
      "全屋"
    ],
    "budget": 15000,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "彭慧敏",
    "originalDesigner": "周坤",
    "designer": "周坤",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "待报价",
        "at": "2026-01-25T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-25T16:00:00.000Z"
  },
  {
    "id": "ord-0250",
    "customerName": "长沙县博雅湘水湾8栋1单元201",
    "phone": "—",
    "address": "长沙县博雅湘水湾8栋1单元201",
    "spaces": [
      "全屋"
    ],
    "budget": 12090,
    "dispatchStore": "东岸万象",
    "deposit": 1000,
    "orderAmount": 12090,
    "afterSalesAmount": null,
    "dispatcherName": "罗丹",
    "originalDesigner": "周坤",
    "designer": "周坤",
    "transferRecords": [],
    "status": "已安装",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-26T16:00:00.000Z"
  },
  {
    "id": "ord-0251",
    "customerName": "国辰府26栋805",
    "phone": "—",
    "address": "国辰府26栋805",
    "spaces": [
      "全屋"
    ],
    "budget": 20000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-27T16:00:00.000Z"
  },
  {
    "id": "ord-0252",
    "customerName": "保利北中心J区11-1402",
    "phone": "—",
    "address": "保利北中心J区11-1402",
    "spaces": [
      "全屋"
    ],
    "budget": 20000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "欧伟明",
    "designer": "欧伟明",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2025-12-31T16:00:00.000Z"
  },
  {
    "id": "ord-0253",
    "customerName": "梅溪盛荟10栋2602",
    "phone": "—",
    "address": "梅溪盛荟10栋2602",
    "spaces": [
      "全屋"
    ],
    "budget": 33000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-01T16:00:00.000Z"
  },
  {
    "id": "ord-0254",
    "customerName": "保利天汇6栋1302",
    "phone": "—",
    "address": "保利天汇6栋1302",
    "spaces": [
      "全屋"
    ],
    "budget": 45000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-02T16:00:00.000Z"
  },
  {
    "id": "ord-0255",
    "customerName": "西城湾前置未交",
    "phone": "—",
    "address": "西城湾前置未交",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "郁金香天冠",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "前置未交定",
        "at": "2026-01-03T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-03T16:00:00.000Z"
  },
  {
    "id": "ord-0256",
    "customerName": "长沙润府A1栋2301前置交订",
    "phone": "—",
    "address": "长沙润府A1栋2301前置交订",
    "spaces": [
      "全屋"
    ],
    "budget": 56800,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "肖亮斌",
    "designer": "肖亮斌",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-04T16:00:00.000Z"
  },
  {
    "id": "ord-0257",
    "customerName": "华润琨瑜府7-1703",
    "phone": "—",
    "address": "华润琨瑜府7-1703",
    "spaces": [
      "全屋"
    ],
    "budget": 90000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-05T16:00:00.000Z"
  },
  {
    "id": "ord-0258",
    "customerName": "康桥悦城3-1902",
    "phone": "—",
    "address": "康桥悦城3-1902",
    "spaces": [
      "全屋"
    ],
    "budget": 38000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "肖金",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已出图",
        "text": "价格不合适退单，已设计",
        "at": "2026-01-06T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-06T16:00:00.000Z"
  },
  {
    "id": "ord-0259",
    "customerName": "卓越蔚蓝海岸17-2709",
    "phone": "—",
    "address": "卓越蔚蓝海岸17-2709",
    "spaces": [
      "全屋"
    ],
    "budget": 35000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "待量尺",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-07T16:00:00.000Z"
  },
  {
    "id": "ord-0260",
    "customerName": "湘江天地三层复式",
    "phone": "—",
    "address": "湘江天地三层复式",
    "spaces": [
      "全屋"
    ],
    "budget": 600000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "杨永",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "设计中",
        "at": "2026-01-08T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-08T16:00:00.000Z"
  },
  {
    "id": "ord-0261",
    "customerName": "望城别墅",
    "phone": "—",
    "address": "望城别墅",
    "spaces": [
      "全屋"
    ],
    "budget": 270000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-09T16:00:00.000Z"
  },
  {
    "id": "ord-0262",
    "customerName": "江山帝景K38-603",
    "phone": "—",
    "address": "江山帝景K38-603",
    "spaces": [
      "全屋"
    ],
    "budget": 73100,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 73100,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-10T16:00:00.000Z"
  },
  {
    "id": "ord-0263",
    "customerName": "保利天禧D4-3404",
    "phone": "—",
    "address": "保利天禧D4-3404",
    "spaces": [
      "全屋"
    ],
    "budget": 35800,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 35800,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-11T16:00:00.000Z"
  },
  {
    "id": "ord-0264",
    "customerName": "福祥家园7--3101",
    "phone": "—",
    "address": "福祥家园7--3101",
    "spaces": [
      "全屋"
    ],
    "budget": 83000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 83000,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-12T16:00:00.000Z"
  },
  {
    "id": "ord-0265",
    "customerName": "桃花家园8-2-2806",
    "phone": "—",
    "address": "桃花家园8-2-2806",
    "spaces": [
      "全屋"
    ],
    "budget": 80000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-13T16:00:00.000Z"
  },
  {
    "id": "ord-0266",
    "customerName": "麓湖郡",
    "phone": "—",
    "address": "麓湖郡",
    "spaces": [
      "全屋"
    ],
    "budget": 180000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周琴",
    "originalDesigner": "刘芸",
    "designer": "刘芸",
    "transferRecords": [],
    "status": "待量尺",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-14T16:00:00.000Z"
  },
  {
    "id": "ord-0267",
    "customerName": "山悦和鸣6-2-1504",
    "phone": "—",
    "address": "山悦和鸣6-2-1504",
    "spaces": [
      "全屋"
    ],
    "budget": 30000,
    "dispatchStore": "郁金香天冠",
    "deposit": 1000,
    "orderAmount": 30000,
    "afterSalesAmount": null,
    "dispatcherName": "曾丹",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已下单",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-15T16:00:00.000Z"
  },
  {
    "id": "ord-0268",
    "customerName": "城信园27-106",
    "phone": "—",
    "address": "城信园27-106",
    "spaces": [
      "全屋"
    ],
    "budget": 5000,
    "dispatchStore": "郁金香万象",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "杨金林",
    "originalDesigner": "何美玲",
    "designer": "何美玲",
    "transferRecords": [],
    "status": "已出图",
    "workflowRemark": null,
    "workflowRemarks": [],
    "createdAt": "2026-01-16T16:00:00.000Z"
  },
  {
    "id": "ord-0269",
    "customerName": "华实领峯2-1502",
    "phone": "—",
    "address": "华实领峯2-1502",
    "spaces": [
      "全屋"
    ],
    "budget": 42000,
    "dispatchStore": "东岸天冠",
    "deposit": 0,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "盛慧",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "前置未定",
        "at": "2026-01-17T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-17T16:00:00.000Z"
  },
  {
    "id": "ord-0270",
    "customerName": "长沙瑞府191户型",
    "phone": "—",
    "address": "长沙瑞府191户型",
    "spaces": [
      "全屋"
    ],
    "budget": 50000,
    "dispatchStore": "东岸天冠",
    "deposit": 1000,
    "orderAmount": null,
    "afterSalesAmount": null,
    "dispatcherName": "周红艳",
    "originalDesigner": "唐姣君",
    "designer": "唐姣君",
    "transferRecords": [],
    "status": "已量尺",
    "workflowRemark": null,
    "workflowRemarks": [
      {
        "stage": "已量尺",
        "text": "销售邀约中",
        "at": "2026-01-18T16:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-18T16:00:00.000Z"
  }
];
