<template>
<header id="header" class="component">
    <h1>Note Strip</h1>
    <nav>
        <ul>
            <li><RouterLink :to="{ name: 'home' }">Home</RouterLink></li>
            <li><RouterLink :to="{ name: 'about' }">About</RouterLink></li>
            <li><RouterLink :to="{ name: 'sign-up' }">Sign Up</RouterLink></li>
        </ul>
    </nav>
</header>
</template>


<script setup>
import { RouterLink } from 'vue-router';
</script>
