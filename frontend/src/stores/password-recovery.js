import { reactive } from 'vue';
import { defineStore } from 'pinia';

export const usePasswordRecoveryStore = defineStore('password-recovery', () => {
    const passwordRecovery = reactive({
        email: '',
        password: '',
        confirm_password: '',
        verification_code: ''
    });

    const component = reactive({
        email_form: true,
        verification_form: false,
        password_form: false,
        timer: {
            time_left: 0,
            start: false,
            id: 0,
            clock: 600
        }
    });

    const resetPasswordRecovery = () => {
        passwordRecovery.email = '';
        passwordRecovery.password = '';
        passwordRecovery.confirm_password = '';
        passwordRecovery.verification_code = '';
    }

    const resetComponent = () => {
        component.email_form = true;
        component.verification_form = false,
        component.password_form = false,
        component.timer.time_left = 0,
        component.timer.start = false
        component.timer.id = 0;
    }

    return { passwordRecovery, component, resetPasswordRecovery, resetComponent }
}, { persist: { enabled: true } });
