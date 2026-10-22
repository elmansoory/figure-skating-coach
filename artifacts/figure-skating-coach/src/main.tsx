import { createRoot } from "react-dom/client";
import { DirectionProvider } from "@radix-ui/react-direction";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <DirectionProvider dir="rtl">
    <App />
  </DirectionProvider>,
);
