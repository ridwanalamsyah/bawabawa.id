import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    permissions: []
};
const slice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setSession(state, action) {
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken;
            state.user = action.payload.user;
            state.permissions = action.payload.permissions;
        },
        clearSession(state) {
            state.accessToken = undefined;
            state.refreshToken = undefined;
            state.user = undefined;
            state.permissions = [];
        }
    }
});
export const { setSession, clearSession } = slice.actions;
export const authReducer = slice.reducer;
