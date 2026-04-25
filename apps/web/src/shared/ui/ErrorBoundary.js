import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
export class ErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) {
            return _jsx("p", { children: "Terjadi error. Silakan refresh halaman." });
        }
        return this.props.children;
    }
}
