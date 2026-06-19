import { Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { AuthGuard } from "./components/AuthGuard";
import CommandCenter from "./pages/CommandCenter";
import CompanySetup from "./pages/CompanySetup";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { commandCenterWorkspaceRoutes } from "./lib/command-center-routes";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route path="/company/new" element={<CompanySetup />} />
        {commandCenterWorkspaceRoutes.map(({ path, props }) => (
          <Route key={path} path={path} element={<CommandCenter {...props} />} />
        ))}
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
