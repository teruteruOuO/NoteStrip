<template>
<header>
    <nav>
        <section class="logo">
            <img src="../../public/images/Cat.png" alt="Notestrip-Cat">
            <h1>NoteStrip</h1>
        </section>
        
        <ul :class="['menu', { 'open': isDesktop || isMenuOpen }]">
            <li><RouterLink :to="{ name: 'about' }">About</RouterLink></li>
            <li><RouterLink :to="{ name: 'contact-us' }">Contact Us</RouterLink></li>

            <!-- Logged out -->
            <li v-if="!user.user.id"><RouterLink :to="{ name: 'login' }">Login</RouterLink></li>

            <!-- Logged in -->
            <li v-if="user.user.id"><RouterLink :to="{ name: 'books' }">Books</RouterLink></li>
            <li v-if="user.user.id"><RouterLink :to="{ name: 'dashboard' }">Dashboard</RouterLink></li>
            <li v-if="user.user.id && !route.path.includes('account')"><RouterLink :to="{ name: 'account-logs' }">Account</RouterLink></li>

            <!-- In accounts page -->
            <li v-if="user.user.id && route.path.includes('account')"><RouterLink :to="{ name: 'account-email' }">Email</RouterLink></li>
            <li v-if="user.user.id && route.path.includes('account')"><RouterLink :to="{ name: 'account-password' }">Password</RouterLink></li>
            <li v-if="user.user.id && route.path.includes('account')"><RouterLink :to="{ name: 'account-logs' }">Logs</RouterLink></li>
        </ul>
    </nav>
    
    <button type="button" v-if="!isDesktop" @click="isMenuOpen = !isMenuOpen" :aria-expanded="isMenuOpen.toString()">
        <span v-if="!isMenuOpen">︾</span>
        <span v-else>︽</span>
    </button>
</header>
</template>


<script setup>
import { RouterLink, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const user = useUserStore();
const route = useRoute();

// Show navigation button if page width is at a certain length
const windowWidth = ref(window.innerWidth);                             // Determine table orientation based on screen width
const updateWidth = () => { windowWidth.value = window.innerWidth };
onMounted(() => { window.addEventListener('resize', updateWidth) });
onUnmounted(() => window.removeEventListener('resize', updateWidth));

const isDesktop = computed(() => windowWidth.value >= 667);
const isMenuOpen = ref(false); // Menu visibility source of truth 

/* Sync menu with breakpoint:
   - Desktop: always open
   - Mobile: closed by default (user toggles) */
watch(isDesktop, (desktop) => {
    isMenuOpen.value = desktop ? true : false;
}, { immediate: true });
</script>

<!-- Animation for showing and disappearing the navigation lists in phone vertical -->
<style scoped>
.menu {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.28s ease, opacity 0.2s ease;
    will-change: max-height, opacity;
}

/* When open, expand/fade in */
.menu.open {
    /* pick a value safely larger than your tallest menu */
    max-height: 5000px;
    opacity: 1;
}

/* Desktop: always visible, no animation/jank on resize */
@media (min-width: 667px) {
    .menu {
        overflow: visible;
        max-height: none;
        opacity: 1;
        transition: none;
    }
}
</style>
