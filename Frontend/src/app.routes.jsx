import { Navigate, createBrowserRouter } from "react-router";

import {
  GuestRoute,
  ProtectedRoute,
} from "./features/auth/components/RouteGuards.jsx";
import Login from "./features/auth/pages/Login.jsx";
import Register from "./features/auth/pages/Register.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import ReportGenerationPage from "./features/reports/pages/ReportGenerationPage.jsx";
import ReportStudioPage from "./features/reports/pages/ReportStudioPage.jsx";

const router = createBrowserRouter([
  // ── Public landing page (everyone can see) ──────────────────────────
  { path: "/", element: <LandingPage /> },

  // ── Auth pages (guests only) ─────────────────────────────────────────
  {
    element: <GuestRoute />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },

  // ── Protected app pages ──────────────────────────────────────────────
  // Workspace: report generation plus the saved-report studio.
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/app", element: <ReportGenerationPage /> },
      { path: "/app/report-studio", element: <ReportStudioPage /> },
    ],
  },

  // Old studio URL now points at the single studio route.
  {
    path: "/app/interviewgenerator",
    element: <Navigate to="/app/report-studio" replace />,
  },
]);

export default router;
