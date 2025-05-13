<template>
  <div class="detail-container" v-loading="loading">
    <el-page-header @back="goBack">
      <template #content>
        <h1>{{ buildingName }} 能耗详情</h1>
      </template>
    </el-page-header>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>近7天能耗趋势</span>
          </template>
          <EnergyChart
            type="line"
            :title="`${buildingName}能耗趋势`"
            :data="chartData"
            height="400px"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>用电统计</span>
          </template>
          <div class="stat-list">
            <div class="stat-item">
              <span>总用电量</span>
              <strong>{{ stats.electricity.total }} kWh</strong>
            </div>
            <div class="stat-item">
              <span>日均用电</span>
              <strong>{{ stats.electricity.avg.toFixed(1) }} kWh</strong>
            </div>
            <div class="stat-item">
              <span>最高用电</span>
              <strong>{{ stats.electricity.max }} kWh</strong>
            </div>
            <div class="stat-item">
              <span>最低用电</span>
              <strong>{{ stats.electricity.min }} kWh</strong>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>用水统计</span>
          </template>
          <div class="stat-list">
            <div class="stat-item">
              <span>总用水量</span>
              <strong>{{ stats.water.total }} 吨</strong>
            </div>
            <div class="stat-item">
              <span>日均用水</span>
              <strong>{{ stats.water.avg.toFixed(1) }} 吨</strong>
            </div>
            <div class="stat-item">
              <span>最高用水</span>
              <strong>{{ stats.water.max }} 吨</strong>
            </div>
            <div class="stat-item">
              <span>最低用水</span>
              <strong>{{ stats.water.min }} 吨</strong>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getEnergyData, getBuildings } from "@/api/energy";
import EnergyChart from "@/components/EnergyChart.vue";

const route = useRoute();
const router = useRouter();
const buildingId = route.params.id.toString();

const loading = ref(true);
const energyData = ref([]);
const buildings = ref([]);

// 合并统计计算，减少计算属性数量
const stats = computed(() => {
  const result = {
    electricity: { total: 0, avg: 0, max: 0, min: 0 },
    water: { total: 0, avg: 0, max: 0, min: 0 }
  };

  if (energyData.value.length) {
    const elecValues = energyData.value.map(item => item.electricity);
    const waterValues = energyData.value.map(item => item.water);

    result.electricity.total = elecValues.reduce((sum, val) => sum + val, 0);
    result.electricity.avg = result.electricity.total / elecValues.length;
    result.electricity.max = Math.max(...elecValues);
    result.electricity.min = Math.min(...elecValues);

    result.water.total = waterValues.reduce((sum, val) => sum + val, 0);
    result.water.avg = result.water.total / waterValues.length;
    result.water.max = Math.max(...waterValues);
    result.water.min = Math.min(...waterValues);
  }

  return result;
});

const buildingName = computed(() => {
  return buildings.value.find(b => b.id === buildingId)?.name || "未知";
});

const chartData = computed(() => {
  if (!energyData.value.length) return null;

  return {
    dates: energyData.value.map(item => item.date),
    electricity: energyData.value.map(item => item.electricity),
    water: energyData.value.map(item => item.water)
  };
});

// 并行获取数据
const fetchData = async () => {
  try {
    loading.value = true;
    const [buildingsData, energyDataRes] = await Promise.all([
      getBuildings(),
      getEnergyData(buildingId)
    ]);
    buildings.value = buildingsData;
    energyData.value = energyDataRes;
  } catch (error) {
    console.error("数据加载失败:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

const goBack = () => {
  router.go(-1);
};
</script>

<style scoped>
.detail-container {
  padding: 20px;
}
.mt-20 {
  margin-top: 20px;
}
.stat-list {
  padding: 10px;
}
.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-light);
}
.stat-item span {
  color: var(--el-text-color-secondary);
}
.stat-item strong {
  color: var(--el-text-color-primary);
  font-weight: bold;
}
</style>
