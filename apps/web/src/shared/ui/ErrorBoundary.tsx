import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError() {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return <p>Terjadi error. Silakan refresh halaman.</p>;
    }
    return this.props.children;
  }
}
