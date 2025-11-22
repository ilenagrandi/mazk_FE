import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import WelcomeOnboarding from './pages/welcome-onboarding';
import CreateAICloser from './pages/create-ai-closer';
import AIClosersManagement from './pages/ai-closers-management';
import ClonePreview from './pages/clone-preview';
import ProductContext from './pages/product-context';
import ImportLeads from './pages/import-leads';
import LeadsManagement from './pages/leads-management';
import CallInterface from './pages/call-interface';

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Define your routes here */}
          <Route path="/" element={<WelcomeOnboarding />} />
          <Route path="/create-ai-closer" element={<CreateAICloser />} />
          <Route path="/ai-closers-management" element={<AIClosersManagement />} />
          <Route path="/clone-preview" element={<ClonePreview />} />
          <Route path="/product-context" element={<ProductContext />} />
          <Route path="/import-leads" element={<ImportLeads />} />
          <Route path="/leads-management" element={<LeadsManagement />} />
          <Route path="/call-interface" element={<CallInterface />} />
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;

