import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force cache invalidation - v2.0.0
console.log("Loading Pharmacy App v2.0.0");

createRoot(document.getElementById("root")!).render(<App />);
