<template>
<main id="login" class="view">
    <LoginComponent />
    <section>
        <p><RouterLink :to="{ name: 'password-recovery' }">Forgot Password?</RouterLink></p>
        <p><RouterLink :to="{ name: 'sign-up' }">Sign Up</RouterLink></p>
    </section>
</main>
</template>

<script setup>
import LoginComponent from '@/components/login/LoginComponent.vue';
import { RouterLink } from 'vue-router';
</script>