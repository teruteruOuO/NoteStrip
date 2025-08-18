<template>
<section id="homepage" class="component">
    <nav>
        <ul>
            <li><RouterLink :to="{ name: 'about' }">About</RouterLink></li>
            <li><RouterLink :to="{ name: 'contact-us' }">Contact Us</RouterLink></li>

            <!-- Dashboard if logged in, Log in if not -->
            <li v-if="user.user.id"><RouterLink :to="{ name: 'dashboard' }">Dashboard</RouterLink></li>
            <li v-else><RouterLink :to="{ name: 'login' }">Login</RouterLink></li>
        </ul>
    </nav>
</section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/user';

const user = useUserStore();
</script>