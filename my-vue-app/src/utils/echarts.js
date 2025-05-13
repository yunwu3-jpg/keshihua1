import * as echarts from "echarts";

export const initChart = (dom, option) => {
  const chart = echarts.init(dom);
  chart.setOption(option);
  return chart;
};

export const resizeChart = (chart) => {
  chart && chart.resize();
};

export const disposeChart = (chart) => {
  chart && chart.dispose();
};

export const getLineChartOption = (title, xData, yData) => {
  return {
    title: { text: title, left: "center" },
    tooltip: { trigger: "axis" },
    grid: { containLabel: true },
    xAxis: {
      type: "category",
      data: xData,
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "用电量(kWh)",
        type: "line",
        data: yData.electricity,
        smooth: true,
        lineStyle: { width: 3 },
        itemStyle: { color: "#5470C6" },
      },
      {
        name: "用水量(吨)",
        type: "line",
        data: yData.water,
        smooth: true,
        lineStyle: { width: 3 },
        itemStyle: { color: "#91CC75" },
      },
    ],
    legend: { bottom: 0 },
  };
};

export const getPieChartOption = (title, data, dataType = "electricity") => {
  return {
    title: { text: title, left: "center" },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const { name, value } = params.data;
        // 根据图表类型显示不同数据
        return dataType === "electricity"
          ? `${name}<br/>用电量: ${value} kWh`
          : `${name}<br/>用水量: ${value} 吨`;
      },
    },
    legend: { orient: "vertical", left: "left" },
    series: [
      {
        name: title,
        type: "pie",
        radius: "50%",
        data: data.map((item) => ({
          name: item.name,
          value: item.value,
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
};

