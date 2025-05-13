<template>
  <div ref="chartEl" :style="{ width, height }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import * as echarts from "echarts";
import { getLineChartOption, getPieChartOption } from "@/utils/echarts";

const props = defineProps({
  type: {
    type: String,
    default: "line",
    validator: (value) => ["line", "pie"].includes(value),
  },
  title: String,
  data: Object,
  width: {
    type: String,
    default: "100%",
  },
  height: {
    type: String,
    default: "400px",
  },
});

const chartEl = ref(null);
let chartInstance = null;

// 修改后的饼图选项函数
const getPieChartOptionWithPercentage = (title, data) => {
  const option = getPieChartOption(title, data);

  // 添加标签配置以显示百分比
  option.series[0].label = {
    formatter: function (params) {
      // 显示名称、值和百分比
      return `${params.name}\n${params.percent}%`;
    },
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  };

  // 添加引导线配置
  option.series[0].labelLine = {
    show: true,
    length: 10,
    length2: 10,
  };

  // 添加鼠标悬停效果
  option.series[0].emphasis = {
    label: {
      show: true,
      fontSize: "14",
      fontWeight: "bold",
    },
  };

  return option;
};

const renderChart = () => {
  if (!chartEl.value || !props.data) return;

  if (!chartInstance) {
    chartInstance = echarts.init(chartEl.value);
  }

  const option =
    props.type === "line"
      ? getLineChartOption(props.title, props.data.dates, {
          electricity: props.data.electricity,
          water: props.data.water,
        })
      : getPieChartOptionWithPercentage(props.title, props.data);

  chartInstance.setOption(option);
};

// 防抖函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const resizeChart = debounce(() => {
  if (chartInstance) {
    chartInstance.resize();
  }
}, 200);

onMounted(() => {
  renderChart();
  window.addEventListener("resize", resizeChart);
});

onBeforeUnmount(() => {
  if (chartInstance) {
    window.removeEventListener("resize", resizeChart);
    chartInstance.dispose();
    chartInstance = null;
  }
});

watch(() => props.data, renderChart, { deep: true });
</script>
