import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Background } from "./screens/Background/Background";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Background />
  </StrictMode>,
);