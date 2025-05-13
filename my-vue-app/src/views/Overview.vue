<template>
  <div class="overview-container">
    <h1>教学楼能耗总览</h1>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>各教学楼用电量占比</span>
          </template>
          <EnergyChart
            type="pie"
            title="用电量占比"
            :data="electricityData"
            height="350px"
          />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>各教学楼用水量占比</span>
          </template>
          <EnergyChart
            type="pie"
            title="用水量占比"
            :data="waterData"
            height="350px"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>能耗统计</span>
          </template>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">总用电量</div>
              <div class="stat-value">{{ stats.totalElectricity }} kWh</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">总用水量</div>
              <div class="stat-value">{{ stats.totalWater }} 吨</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">教学楼数量</div>
              <div class="stat-value">{{ stats.buildingCount }} 栋</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">平均用电</div>
              <div class="stat-value">
                {{ stats.avgElectricity.toFixed(1) }} kWh/栋
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-title">平均用水</div>
              <div class="stat-value">
                {{ stats.avgWater.toFixed(1) }} 吨/栋
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <h2>各教学楼能耗详情</h2>
    <el-row :gutter="20">
      <el-col
        v-for="building in summaryData"
        :key="building.id"
        :xs="24"
        :sm="12"
        :md="8"
      >
        <BuildingCard :building="building" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getSummaryData } from "@/api/energy";
import BuildingCard from "@/components/BuildingCard.vue";
import EnergyChart from "@/components/EnergyChart.vue";

const summaryData = ref([]);
const loading = ref(true);

// 合并统计计算
const stats = computed(() => {
  const result = {
    totalElectricity: 0,
    totalWater: 0,
    buildingCount: 0,
    avgElectricity: 0,
    avgWater: 0,
  };

  if (summaryData.value.length) {
    result.buildingCount = summaryData.value.length;
    result.totalElectricity = summaryData.value.reduce(
      (sum, b) => sum + b.totalElectricity,
      0
    );
    result.totalWater = summaryData.value.reduce(
      (sum, b) => sum + b.totalWater,
      0
    );
    result.avgElectricity = result.totalElectricity / result.buildingCount;
    result.avgWater = result.totalWater / result.buildingCount;
  }

  return result;
});

// 优化饼图数据准备
const preparePieData = (key) => {
  return summaryData.value.length
    ? summaryData.value.map((item) => ({
        name: item.name,
        value: item[key],
      }))
    : [];
};

const electricityData = computed(() => preparePieData("totalElectricity"));
const waterData = computed(() => preparePieData("totalWater"));

const CACHE_KEY = "summaryDataCache";
const CACHE_TTL = 30 * 60 * 1000; // 30分钟缓存

onMounted(async () => {
  try {
    loading.value = true;

    // 检查缓存有效性
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedData = cached ? JSON.parse(cached) : null;

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      summaryData.value = cachedData.data;
    } else {
      const data = await getSummaryData();
      summaryData.value = data;
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    }
  } catch (error) {
    console.error("数据加载失败:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.overview-container {
  padding: 20px;
}
h1,
h2 {
  margin-bottom: 20px;
  color: var(--el-text-color-primary);
}
.mt-20 {
  margin-top: 20px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  padding: 16px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
  text-align: center;
}
.stat-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}
</style>
