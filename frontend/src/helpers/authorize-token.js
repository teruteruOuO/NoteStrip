import axios from "axios";
import { useUserStore } from "@/stores/user";

// Determine a user's authority for accessing each webpage before they can continue
export const authorizeToken = async (routeName, requiresAuth) => {
    const user = useUserStore();

    try {
        const body = { 
            name: routeName, 
            requires_authentication: requiresAuth
        }
        const response = await axios.post('/api/authentication/verify-token', body);
        console.log(response.data.message);

        return true;

    } catch (err) {
        const response = err.response;
        // Automatically log out the user if there's an authorization issue (ex: expired token)
        if (response && response.status >= 400 && response.status <= 499) {
            if (response.data.expired) {
                alert(response.data.message);
            }

            console.warn(response.data.message);
            user.user.id = null;
        }

        return false;
    }
}