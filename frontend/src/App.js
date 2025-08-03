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
import { Toaster } from "./components/ui/toaster";

const Home = () => {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <DocumentProcessor />
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
        <Toaster />
      </AuthProvider>
    </div>
  );
}

export default App;