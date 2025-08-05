import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
		},
		{
			path: '/about',
			name: 'about',
			component: () => import('../views/AboutView.vue'),
		},
		{
			path: '/sign-up',
			name: 'sign-up',
			component: () => import('../views/SignupView.vue'),
		},
		{
			path: '/login',
			name: 'login',
			component: () => import('../views/LoginView.vue'),
		},
		{
			path: '/password-recovery',
			name: 'password-recovery',
			component: () => import('../views/PasswordRecoveryView.vue'),
		},
		{
			path: '/dashboard',
			name: 'dashboard',
			meta: { requiresAuth: true },
			component: () => import('../views/DashboardView.vue'),
		},
	],
});

export default router;
