<template>
  <el-card
    shadow="hover"
    class="building-card"
    @click="handleCardClick"
    :style="cardStyle"
  >
    <template #header>
      <div class="card-header">
        <span class="building-name">{{ building.name }}</span>
        <el-tag :type="tagType" size="small" effect="plain">
          {{ building.location }}
        </el-tag>
      </div>
    </template>
    <div class="card-content">
      <div v-for="stat in displayedStats" :key="stat.label" class="stat-item">
        <span class="stat-label">{{ stat.label }}</span>
        <strong class="stat-value">{{ stat.value }}</strong>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed, defineProps } from "vue";
import { useRouter } from "vue-router";
import { debounce } from "lodash-es";

const props = defineProps({
  building: {
    type: Object,
    required: true,
    validator: (value) => {
      return [
        "id",
        "name",
        "location",
        "area",
        "floors",
        "avgElectricity",
        "avgWater",
      ].every((prop) => prop in value);
    },
  },
  // 添加延迟加载选项
  lazy: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();

// 预计算标签类型，避免每次渲染都计算
const tagType = computed(() => {
  const types = {
    东区: "success",
    西区: "warning",
    南区: "danger",
    北区: "info",
  };
  return types[props.building.location] || "";
});

// 预计算统计数据，避免模板中复杂计算
const displayedStats = computed(() => [
  { label: "建筑面积", value: `${props.building.area} ㎡` },
  { label: "楼层数", value: `${props.building.floors} 层` },
  {
    label: "日均用电",
    value: `${props.building.avgElectricity.toFixed(1)} kWh`,
  },
  {
    label: "日均用水",
    value: `${props.building.avgWater.toFixed(1)} 吨`,
  },
]);

// 使用CSS变量优化样式变化性能
const cardStyle = computed(() => ({
  "--hover-transform": "translateY(-5px)",
  "--transition-duration": "0.2s",
}));

// 添加防抖的点击处理
const handleCardClick = debounce(
  () => {
    router.push({
      name: "Detail",
      params: { id: props.building.id },
      // 添加路由跳转优化
      state: { fromCard: true },
    });
  },
  150,
  { leading: true, trailing: false }
);
</script>

<style scoped>
/* 使用CSS变量提高样式性能 */
.building-card {
  --hover-transform: translateY(0);
  --transition-duration: 0.3s;

  margin-bottom: 20px;
  cursor: pointer;
  will-change: transform; /* 提示浏览器优化变换 */
  transition: transform var(--transition-duration) ease,
    box-shadow var(--transition-duration) ease;
  contain: content; /* 限制浏览器重绘范围 */
}

.building-card:hover {
  transform: var(--hover-transform);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  contain: layout style; /* 优化渲染性能 */
}

.building-name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.card-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  contain: layout; /* 优化渲染性能 */
}

.stat-item {
  display: flex;
  flex-direction: column;
  contain: content; /* 优化渲染性能 */
}

.stat-label {
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
}

.stat-value {
  font-size: 1rem;
  margin-top: 0.25rem;
  line-height: 1.4;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 减少媒体查询的使用，改用响应式布局 */
@media (max-width: 768px) {
  .card-content {
    grid-template-columns: 1fr;
  }
}
</style>
