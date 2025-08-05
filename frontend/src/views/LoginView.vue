<template>
<main id="login" class="view">
    <LoginComponent />
    <section>
        <p><RouterLink :to="{ name: 'password-recovery' }">Forgot Password?</RouterLink></p>
    </section>
</main>
</template>

<script setup>
import LoginComponent from '@/components/login/LoginComponent.vue';
import { RouterLink } from 'vue-router';
</script>