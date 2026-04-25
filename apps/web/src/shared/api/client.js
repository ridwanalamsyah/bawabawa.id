import axios from "axios";
import { clearSession, setSession } from "../../features/auth/auth.slice";
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1"
});
let boundStore = null;
export function bindApiAuthStore(store) {
    if (boundStore)
        return;
    boundStore = store;
    api.interceptors.request.use((config) => {
        const token = store.getState().auth.accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    api.interceptors.response.use((response) => response, async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;
        const refreshToken = store.getState().auth.refreshToken;
        if (status === 401 &&
            refreshToken &&
            !originalRequest?._retry &&
            !String(originalRequest?.url ?? "").includes("/auth/refresh")) {
            originalRequest._retry = true;
            try {
                const refreshResponse = await api.post("/auth/refresh", { refreshToken });
                const nextAccess = String(refreshResponse.data.data?.accessToken ?? "");
                const nextRefresh = String(refreshResponse.data.data?.refreshToken ?? refreshToken);
                store.dispatch(setSession({
                    ...store.getState().auth,
                    accessToken: nextAccess,
                    refreshToken: nextRefresh,
                    permissions: store.getState().auth.permissions
                }));
                originalRequest.headers.Authorization = `Bearer ${nextAccess}`;
                return api(originalRequest);
            }
            catch {
                store.dispatch(clearSession());
            }
        }
        return Promise.reject(error);
    });
}
