import React from "react";
import { C, body } from "../data/theme";

export default class ErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("App error:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="p-6 text-center" style={{ ...body, color: C.ink }}>
          <p className="text-sm font-bold">Something went wrong.</p>
          <button
            onClick={() => this.setState({ failed: false })}
            className="mt-3 px-4 py-2 rounded-xl text-sm"
            style={{ background: C.teal, color: "#fff", fontWeight: 700 }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
