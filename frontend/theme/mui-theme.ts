import { createTheme } from "@mui/material/styles"

export const getMuiTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      background: {
        default: mode === "dark" ? "#0f0f0f" : "#fafafa",
        paper: mode === "dark" ? "#111111" : "#ffffff",
      },
    },
  })
