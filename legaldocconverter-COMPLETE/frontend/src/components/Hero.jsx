import React from 'react';
import { Button } from './ui/button';
import { ArrowRight, Shield, Zap, FileCheck } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-20 lg:py-32 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-indigo-400/20 to-slate-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-blue-300/10 to-indigo-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Badge */}
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-full text-sm font-medium text-blue-800 mb-8 shadow-sm">
            <Shield className="h-4 w-4 mr-2 text-blue-600" />
            Trusted by Legal Professionals Worldwide
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Convert & Analyze
            <span className="block text-slate-800">Legal Documents</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-700">
              Instantly
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Professional document conversion and AI-powered legal analysis at legaldocconverter.com. 
            Convert PDFs, DOCX, TXT files and get detailed legal insights in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0"
            >
              Start Converting Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-slate-300 text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 hover:border-blue-300 hover:text-blue-700 px-8 py-4 text-lg font-semibold transition-all duration-300"
            >
              Watch Demo
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="group flex flex-col items-center p-8 bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-sm border border-blue-100/50 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileCheck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Multi-Format Support</h3>
              <p className="text-slate-600 text-center leading-relaxed">Convert between PDF, DOCX, TXT, RTF, and more formats seamlessly.</p>
            </div>

            <div className="group flex flex-col items-center p-8 bg-gradient-to-br from-white to-indigo-50/50 rounded-2xl shadow-sm border border-indigo-100/50 hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="p-4 bg-gradient-to-br from-indigo-500 to-slate-600 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">AI-Powered Analysis</h3>
              <p className="text-slate-600 text-center leading-relaxed">Get detailed legal insights, risk assessments, and compliance checks.</p>
            </div>

            <div className="group flex flex-col items-center p-8 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 transform hover:-translate-y-2">
              <div className="p-4 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Enterprise Security</h3>
              <p className="text-slate-600 text-center leading-relaxed">Bank-level encryption and compliance with legal industry standards.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;