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
            <li v-if="user.user.id"><RouterLink :to="{ name: 'account-email' }">Account</RouterLink></li>
        </ul>
    </nav>
    
    <!-- Show only when route contains the string "account" -->
    <nav class="account" v-if="route.path.includes('account')">
        <ul>
            <li><RouterLink :to="{ name: 'account-email' }">Email</RouterLink></li>
            <li><RouterLink :to="{ name: 'account-password' }">Password</RouterLink></li>
        </ul>
    </nav>
</header>
</template>


<script setup>
import { RouterLink, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';

const user = useUserStore();
const route = useRoute();
</script>
