import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AboutPage } from "./features/about/AboutPage";
import { AdminOverviewPage } from "./features/admin/AdminOverviewPage";
import { LoginPage } from "./features/auth/components/LoginPage";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { AppLayout } from "./features/layout/components/AppLayout";
import { HomePage } from "./features/home/HomePage";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
