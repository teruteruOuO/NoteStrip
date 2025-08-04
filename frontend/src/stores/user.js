import { reactive } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
    const user = reactive({ id: null });

    return { user }
}, { persist: { enabled: true } });

