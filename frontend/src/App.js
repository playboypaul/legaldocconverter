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
import { BannerAd, ContentRichAd } from "./components/ads/AdSenseAd";

const Home = () => {
  return (
    <>
      <Header />
      <Hero />
      
      {/* Content-rich ad after hero section for better AdSense compliance */}
      <ContentRichAd topic="Legal Document Conversion" />
      
      <Features />
      
      {/* Banner ad between features and processor */}
      <BannerAd />
      
      <DocumentProcessor />
      
      {/* Content-rich ad before pricing for affiliate opportunities */}
      <ContentRichAd topic="Professional Legal Software" />
      
      <Pricing />
      <Footer />
    </>
  );
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
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