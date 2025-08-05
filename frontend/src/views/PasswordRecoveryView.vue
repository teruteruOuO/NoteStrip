<template>
<main id="password-recovery" class="view">
    <EnterEmailComponent v-if="passwordRecovery.component.email_form"/>
    <VerifyCodeComponent v-else-if="passwordRecovery.component.verification_form"/>
    <ChangePasswordComponent v-else-if="passwordRecovery.component.password_form"/>
</main>
</template>

<script setup>
import EnterEmailComponent from '@/components/password-recovery/EnterEmailComponent.vue';
import VerifyCodeComponent from '@/components/password-recovery/VerifyCodeComponent.vue';
import ChangePasswordComponent from '@/components/password-recovery/ChangePasswordComponent.vue';
import { usePasswordRecoveryStore } from '@/stores/password-recovery';

const passwordRecovery = usePasswordRecoveryStore();
</script>