import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import { FileText, Shield, Zap, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const AboutPage = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              About <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">LegalDocConverter</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to streamline legal document workflows for professionals worldwide. 
              Our platform combines cutting-edge technology with legal industry expertise to deliver 
              reliable, secure, and efficient document processing solutions.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Our Story</h2>
            <div className="prose prose-lg max-w-none text-slate-700">
              <p className="mb-6">
                LegalDocConverter was founded in 2024 by a team of legal technology professionals who 
                recognized a critical gap in the market. Law firms and legal departments were spending 
                countless hours manually converting, formatting, and processing documents—time that could 
                be better spent serving clients.
              </p>
              <p className="mb-6">
                Our founders, with combined experience spanning corporate law, software engineering, and 
                AI research, set out to build a platform that would handle the technical complexity of 
                document processing while meeting the stringent security and compliance requirements of 
                the legal industry.
              </p>
              <p className="mb-6">
                Today, LegalDocConverter serves over 50,000 legal professionals across Canada, the United 
                States, and beyond. From solo practitioners to Am Law 100 firms, our platform has become 
                an essential tool for modern legal practice.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Shield,
                  title: "Security First",
                  description: "Every feature we build starts with security. Your client data deserves bank-grade protection, and that's exactly what we provide."
                },
                {
                  icon: Zap,
                  title: "Efficiency",
                  description: "Time is your most valuable resource. Our tools are designed to process documents in seconds, not hours."
                },
                {
                  icon: CheckCircle,
                  title: "Reliability",
                  description: "Legal work demands precision. Our platform delivers consistent, accurate results you can depend on."
                },
                {
                  icon: Clock,
                  title: "Innovation",
                  description: "We continuously evolve our platform with the latest AI and document processing technologies."
                }
              ].map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl w-fit mb-4">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h3>
                    <p className="text-slate-600">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { stat: "50,000+", label: "Legal Professionals" },
                { stat: "2M+", label: "Documents Processed" },
                { stat: "30+", label: "File Formats" },
                { stat: "99.9%", label: "Uptime" }
              ].map((item, index) => (
                <div key={index}>
                  <div className="text-4xl font-bold mb-2">{item.stat}</div>
                  <div className="text-blue-100">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Canadian Focus */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Proudly Canadian</h2>
            <div className="prose prose-lg max-w-none text-slate-700 text-center">
              <p className="mb-6">
                Headquartered in Alberta, Canada, LegalDocConverter is built with Canadian legal 
                professionals in mind. We understand the unique requirements of Canadian law practice, 
                from provincial court filing formats to PIPEDA compliance.
              </p>
              <p className="mb-6">
                Our servers are located in Canada, ensuring your data never crosses borders unless you 
                choose otherwise. We're committed to supporting the Canadian legal community with tools 
                designed for local needs while meeting international standards.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Transform Your Document Workflow?</h2>
            <p className="text-xl text-slate-600 mb-8">
              Join thousands of legal professionals who trust LegalDocConverter.
            </p>
            <Link to="/#processor">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center">
                Start Converting Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;
