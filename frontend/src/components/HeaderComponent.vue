<template>
<header id="header" class="component">
    <h1>Note Strip</h1>
    <nav>
        <ul>
            <li><RouterLink :to="{ name: 'home' }">Home</RouterLink></li>
            <li><RouterLink :to="{ name: 'about' }">About</RouterLink></li>

            <li v-if="!user.user.id"><RouterLink :to="{ name: 'sign-up' }">Sign Up</RouterLink></li>
            <li v-if="!user.user.id"><RouterLink :to="{ name: 'login' }">Login</RouterLink></li>

            <li v-if="user.user.id"><RouterLink :to="{ name: 'dashboard' }">Dashboard</RouterLink></li>
        </ul>
    </nav>
</header>
</template>


<script setup>
import { RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/user';

const user = useUserStore();
</script>
