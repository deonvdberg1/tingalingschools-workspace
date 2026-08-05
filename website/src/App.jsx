import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ErrorBoundary from '@/lib/ErrorBoundary';
import { AuthProvider } from '@/lib/AuthContext';
import PortalLogin from './pages/PortalLogin';
import PortalRegister from './pages/PortalRegister';
import PortalDashboard from './pages/PortalDashboard';

const { Pages, Layout, mainPage, NO_LAYOUT_PAGES = [] } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => {
  if (NO_LAYOUT_PAGES.includes(currentPageName)) {
    return <>{children}</>;
  }
  return Layout ?
    <Layout currentPageName={currentPageName}>{children}</Layout>
    : <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
      {/* ── Portal (independent Ting-A-Ling dashboard: staff / admin / parents) ── */}
      <Route path="/login" element={<PortalLogin />} />
      <Route path="/register" element={<PortalRegister />} />
      <Route path="/portal" element={<PortalDashboard />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <NavigationTracker />
          <AppRoutes />
        </Router>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
