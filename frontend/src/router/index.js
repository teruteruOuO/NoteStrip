import { createRouter, createWebHistory } from 'vue-router'
import { authorizeToken } from '@/helpers/authorize-token';
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
		{
			path: '/account/email',
			name: 'account-email',
			meta: { requiresAuth: true },
			component: () => import('../views/AccountView/AccountEmailView.vue'),
		},
		{
			path: '/account/password',
			name: 'account-password',
			meta: { requiresAuth: true },
			component: () => import('../views/AccountView/AccountPasswordView.vue'),
		},
		{
			path: '/account/logs',
			name: 'account-logs',
			meta: { requiresAuth: true },
			component: () => import('../views/AccountView/AccountLogsView.vue'),
		},
		{
			path: '/books',
			name: 'books',
			meta: { requiresAuth: true },
			component: () => import('../views/BooksView/BooksView.vue'),
		},
		{
			path: '/add-book',
			name: 'add-book',
			meta: { requiresAuth: true },
			component: () => import('../views/BooksView/AddBookView.vue'),
		},
		{
			path: '/view-book/:book_id',
			name: 'view-book',
			meta: { requiresAuth: true },
			component: () => import('../views/BooksView/ViewBookView.vue'),
			props: (route) => ({
				book_id: route.params.book_id,
				name: route.query.name ?? ''
			})
		},
		{
            path: '/:pathMatch(.*)*',
            redirect: { name: 'home' }
        }
	],
});

// This is triggered each time a user navigates from page to page
router.beforeEach(async (to, from, next) => {
    const isValid = await authorizeToken(to.name, to.meta.requiresAuth ? true : false);

    if (isValid) {
		next();
	} else {
		next({ name: 'home'});
	}
    
});


export default router;
