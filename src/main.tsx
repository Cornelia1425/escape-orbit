import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import PrivacyPage from "./components/PrivacyPage";
import "./index.css";

const isPrivacyPage = window.location.pathname === "/privacy";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isPrivacyPage ? <PrivacyPage /> : <App />}
  </StrictMode>
);
