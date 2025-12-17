import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import DocumentProcessor from "./components/DocumentProcessor";
import Pricing from "./components/Pricing";
import Footer from "./components/Footer";
import SignInModal from "./components/auth/SignInModal";
import SignUpModal from "./components/auth/SignUpModal";
import LegalModalManager from "./components/legal/LegalModalManager";
import { Toaster } from "./components/ui/toaster";
import { LegalDocumentGuideWithAd, LegalTechReportWithAd } from "./components/ads/AdSenseAd";
import AffiliateSection from "./components/marketing/AffiliateSection";
import LegalBlog from "./components/content/LegalBlog";
import BlogArticle from "./components/content/BlogArticle";
import TermsOfService from "./components/legal/TermsOfService";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import CookiePolicy from "./components/legal/CookiePolicy";
import SecurityPage from "./components/legal/SecurityPage";

const Home = () => {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <DocumentProcessor />
      {/* Affiliate marketing section */}
      <AffiliateSection />
      <Pricing />
      <Footer />
    </>
  );
};

const BlogPage = () => {
  return (
    <>
      <Header />
      <LegalBlog />
      <Footer />
    </>
  );
};

const GuidesPage = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Legal Document Resources & Guides
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive guides and expert resources for legal document management, 
              conversion, and technology implementation.
            </p>
          </div>
          
          {/* Content with Ad Integration */}
          <LegalDocumentGuideWithAd />
          <LegalTechReportWithAd />
        </div>
      </div>
      <Footer />
    </>
  );
};

// Legal Pages Wrappers
const TermsPage = () => (
  <>
    <Header />
    <TermsOfService />
    <Footer />
  </>
);

const PrivacyPage = () => (
  <>
    <Header />
    <PrivacyPolicy />
    <Footer />
  </>
);

const CookiePage = () => (
  <>
    <Header />
    <CookiePolicy />
    <Footer />
  </>
);

const SecurityPageWrapper = () => (
  <>
    <Header />
    <SecurityPage />
    <Footer />
  </>
);

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/cookies" element={<CookiePage />} />
            <Route path="/security" element={<SecurityPageWrapper />} />
          </Routes>
        </BrowserRouter>
        <SignInModal />
        <SignUpModal />
        <LegalModalManager />
        <Toaster />
      </AuthProvider>
    </div>
  );
}

export default App;