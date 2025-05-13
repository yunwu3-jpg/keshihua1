import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Overview",
    component: () => import("@/views/Overview.vue"),
    meta: { title: "能耗总览" },
  },
  {
    path: "/detail/:id",
    name: "Detail",
    component: () => import("@/views/Detail.vue"),
    props: true,
    meta: { title: "能耗详情" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || "教学楼能耗监控";
  next();
});

export default router;
