/**
 * Main App Component
 * Sets up routing and layout for the CV Analysis application
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { CVAnalysisPage } from './components/cv-analysis/CVAnalysisPage';
import { CandidatesDashboard } from './components/candidates/CandidatesDashboard';
import { AnalysisDetailPage } from './components/candidates/AnalysisDetail';
import { JobPositionsPage } from './components/job-positions/JobPositionsPage';
import { PositionAnalytics } from './components/job-positions/PositionAnalytics';
import { LoginPage } from './components/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotFoundPage } from './components/auth/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <CVAnalysisPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/positions"
            element={
              <ProtectedRoute>
                <Layout>
                  <JobPositionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/positions/:id/analytics"
            element={
              <ProtectedRoute>
                <Layout>
                  <PositionAnalytics />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates"
            element={
              <ProtectedRoute>
                <Layout>
                  <CandidatesDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates/analysis/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <AnalysisDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
