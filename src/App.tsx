import { Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { AuthGuard } from "./components/AuthGuard";
import Dashboard from "./pages/Dashboard";
import CompanySetup from "./pages/CompanySetup";
import FileManager from "./pages/FileManager";
import FieldConfirm from "./pages/FieldConfirm";
import AnalysisReport from "./pages/AnalysisReport";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

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
        <Route path="/" element={<Dashboard />} />
        <Route path="/company/new" element={<CompanySetup />} />
        <Route path="/files" element={<FileManager />} />
        <Route path="/fields" element={<FieldConfirm />} />
        <Route path="/analysis" element={<AnalysisReport />} />
        <Route path="/assistant" element={<AIAssistant />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
