import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1dd1a1" },
    secondary: { main: "#64b5f6" },
    background: {
      default: "#141821",
      paper: "#171c27",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "\"Sora\", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: "contained",
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 16px",
          letterSpacing: "0.2px",
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #1dd1a1 0%, #16b689 100%)",
          color: "#0c1416",
        },
        containedSecondary: {
          background: "linear-gradient(135deg, #64b5f6 0%, #4aa3eb 100%)",
          color: "#0f141b",
        },
        outlined: {
          borderColor: "rgba(255,255,255,0.22)",
          color: "rgba(255,255,255,0.92)",
        },
      },
    },
  },
});

export default theme;
