import axios from "axios";

// 缓存配置
const CACHE_CONFIG = {
  defaultTTL: 3600 * 1000, // 默认缓存时间1小时（毫秒）
  retryTimes: 2, // 失败重试次数
  retryDelay: 1000, // 重试延迟时间
};

const cache = new Map();
const instance = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 5000,
  headers: {
    "Cache-Control": "max-age=3600",
  },
});

// 添加请求重试拦截器
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config || !config.retryTimes) {
      return Promise.reject(error);
    }

    const { retryTimes, retryCount = 0 } = config;
    if (retryCount >= retryTimes) {
      return Promise.reject(error);
    }

    config.retryCount = retryCount + 1;
    await new Promise((resolve) =>
      setTimeout(resolve, config.retryDelay || 1000)
    );
    return instance(config);
  }
);

/**
 * 从缓存获取数据，如果过期则返回null
 * @param {string} key 缓存键
 * @returns {any|null} 缓存数据或null
 */
const getFromCache = (key) => {
  const cachedItem = cache.get(key);
  if (!cachedItem) return null;

  const { data, timestamp, ttl = CACHE_CONFIG.defaultTTL } = cachedItem;
  if (Date.now() - timestamp > ttl) {
    cache.delete(key);
    return null;
  }

  return data;
};

/**
 * 设置缓存数据
 * @param {string} key 缓存键
 * @param {any} data 要缓存的数据
 * @param {number} ttl 缓存时间(毫秒)
 */
const setCache = (key, data, ttl = CACHE_CONFIG.defaultTTL) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
};

/**
 * 获取所有教学楼信息
 * @returns {Promise<Array>} 教学楼数组
 */
export const getBuildings = async () => {
  const cacheKey = "buildings";
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await instance.get("/buildings", {
      retryTimes: CACHE_CONFIG.retryTimes,
      retryDelay: CACHE_CONFIG.retryDelay,
    });
    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error("获取教学楼数据失败:", error);
    throw error;
  }
};

/**
 * 获取指定教学楼的能耗数据
 * @param {string|number} buildingId 教学楼ID
 * @returns {Promise<Array>} 能耗数据数组
 */
export const getEnergyData = async (buildingId) => {
  const cacheKey = `energy-${buildingId}`;
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await instance.get("/energy", {
      params: { buildingId },
      retryTimes: CACHE_CONFIG.retryTimes,
      retryDelay: CACHE_CONFIG.retryDelay,
    });
    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error(`获取教学楼${buildingId}能耗数据失败:`, error);
    throw error;
  }
};

/**
 * 批量获取多个教学楼的能耗数据（优化并发请求）
 * @param {Array<string|number>} buildingIds 教学楼ID数组
 * @returns {Promise<Array>} 能耗数据数组
 */
export const getBatchEnergyData = async (buildingIds) => {
  const uncachedIds = [];
  const cachedResults = {};

  // 先检查缓存
  buildingIds.forEach((id) => {
    const cacheKey = `energy-${id}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      cachedResults[id] = cachedData;
    } else {
      uncachedIds.push(id);
    }
  });

  // 并发请求未缓存的数据
  if (uncachedIds.length > 0) {
    try {
      const requests = uncachedIds.map((id) =>
        instance.get("/energy", {
          params: { buildingId: id },
          retryTimes: CACHE_CONFIG.retryTimes,
          retryDelay: CACHE_CONFIG.retryDelay,
        })
      );

      const responses = await Promise.all(requests);
      responses.forEach((response, index) => {
        const id = uncachedIds[index];
        cachedResults[id] = response.data;
        setCache(`energy-${id}`, response.data);
      });
    } catch (error) {
      console.error("批量获取能耗数据失败:", error);
      throw error;
    }
  }

  // 按原始顺序返回结果
  return buildingIds.map((id) => cachedResults[id]);
};

/**
 * 获取所有教学楼的总能耗数据（优化版本）
 * @returns {Promise<Array>} 总览数据数组
 */
export const getSummaryData = async () => {
  const cacheKey = "summary";
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const buildings = await getBuildings();
    const buildingIds = buildings.map((b) => b.id);

    // 使用批量获取能耗数据
    const allEnergyData = await getBatchEnergyData(buildingIds);

    const summary = buildings.map((building, index) => {
      const energyData = allEnergyData[index];
      if (!energyData || energyData.length === 0) {
        return {
          ...building,
          totalElectricity: 0,
          totalWater: 0,
          avgElectricity: 0,
          avgWater: 0,
        };
      }

      // 使用reduce计算总和，避免多次遍历
      const { totalElectricity, totalWater } = energyData.reduce(
        (acc, item) => {
          acc.totalElectricity += item.electricity || 0;
          acc.totalWater += item.water || 0;
          return acc;
        },
        { totalElectricity: 0, totalWater: 0 }
      );

      return {
        ...building,
        totalElectricity,
        totalWater,
        avgElectricity: totalElectricity / energyData.length,
        avgWater: totalWater / energyData.length,
      };
    });

    setCache(cacheKey, summary);
    return summary;
  } catch (error) {
    console.error("获取总览数据失败:", error);
    throw error;
  }
};

/**
 * 清除指定缓存
 * @param {string} key 缓存键，不传则清除所有缓存
 */
export const clearCache = (key) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};
