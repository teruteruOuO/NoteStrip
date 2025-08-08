import { reactive } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
    const user = reactive({ id: null });

    const changeEmail = reactive({
        form: {
            new_email: '',
            verification_code: ''
        },
        section: { 
            verification_form: false 
        },
        timer: {
			time_left: 0,
			start: false,
			id: 0,
			clock: 600
		}
    });

    const resetChangeEmail = () => {
        changeEmail.form.new_email = '';
        changeEmail.form.verification_code = '';
        changeEmail.section.verification_form = false;
        changeEmail.timer.time_left = 0;
        changeEmail.timer.start = false;
        changeEmail.timer.id = 0;
    }

    return { user, changeEmail, resetChangeEmail }
}, { persist: { enabled: true } });

