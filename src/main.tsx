import { Buffer } from "buffer";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

globalThis.Buffer = Buffer;

  createRoot(document.getElementById("root")!).render(<App />);