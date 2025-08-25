<template>
<main id="sign-up" class="view">
    <SignupFormComponent v-if="signup.component.signup_form"/>
    <VerifyCodeComponent v-else-if="signup.component.verification_form"/>
</main>
</template>


<script setup>
import { useSignupStore } from '@/stores/sign-up';
import SignupFormComponent from '@/components/sign-up/SignupFormComponent.vue';
import VerifyCodeComponent from '@/components/sign-up/VerifyCodeComponent.vue';

const signup = useSignupStore();
</script>