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
            <li v-if="user.user.id && route.path.includes('account')"><a @click="logoutUser" id="logout">Logout</a></li>
        </ul>
    </nav>
    
    <button type="button" v-if="!isDesktop" @click="isMenuOpen = !isMenuOpen" :aria-expanded="isMenuOpen.toString()">
        <span v-if="!isMenuOpen">︾</span>
        <span v-else>︽</span>
    </button>
</header>
</template>


<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import axios from 'axios';


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


// Logout
const router = useRouter();
const feedback = reactive({ message: '', success: false });
const isLoading = reactive({ button: false });
const logoutUser = async () => {
    isLoading.button = true;

    try {
        const response = await axios.post('/api/authentication/logout');
        console.log(response.data.message);
        console.log(`Response data information:`, response);

        user.user.id = null;    // clear id
        router.push({ name: 'home' });  // Reroute to the home page

    } catch (error) {
        console.error(`An error occured while logging out user`);
        feedback.success = false;

        // Handle errors returned from the backend
        if (error.response) {
            console.error("Backend error:", error.response);
            feedback.message = error.response.data.message;

        // Handle unexpected errors
        } else {
            console.error("Unexpected error:", error.message);
            feedback.message = "An unexpected error happend with the component itself. Refresh the page or try contacting the admin.";
        }

    } finally {
        isLoading.button = false;
    }
}
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

/* Logout "Link" */
#logout {
    text-decoration: underline;
    cursor: pointer;
}
</style>
