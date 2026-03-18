import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("UI crashed:", error);
    }
  }

  handleReload = () => {
    if (this.props.onReset) this.props.onReset();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#141821",
            color: "rgba(255,255,255,0.85)",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
              Try reloading the page. If the problem persists, sign out and sign back in.
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
