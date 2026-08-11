import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
