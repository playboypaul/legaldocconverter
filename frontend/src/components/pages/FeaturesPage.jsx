import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  FileText, 
  Brain, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle,
  FileSearch,
  Download,
  Layers,
  Lock,
  GitCompare,
  PenTool,
  Package,
  Settings,
  Globe,
  Clock,
  ArrowRight,
  Star
} from 'lucide-react';

const FeaturesPage = () => {
  const mainFeatures = [
    {
      icon: FileText,
      title: "30+ Format Conversions",
      description: "Convert between PDF, DOCX, TXT, RTF, ODT, HTML, XML, CSV, Excel, PowerPoint, EPUB, Markdown, and more with perfect fidelity.",
      highlights: ["PDF/A archival format", "Batch processing", "Preserved formatting", "Legal citation support"],
      gradient: "from-blue-500 to-indigo-500",
      bgGradient: "from-blue-50 to-indigo-50"
    },
    {
      icon: Brain,
      title: "AI Legal Analysis",
      description: "Advanced AI analyzes contracts, agreements, and legal documents for key insights, risks, and compliance issues.",
      highlights: ["Risk assessment scoring", "Compliance checking", "Key provisions extraction", "Actionable recommendations"],
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-50 to-purple-50"
    },
    {
      icon: Settings,
      title: "Professional PDF Toolkit",
      description: "Complete PDF editing suite with merge, split, encrypt, decrypt, eSign, and compression tools.",
      highlights: ["PDF merge & split", "Password encryption", "Electronic signatures", "Page extraction"],
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with legal industry security standards to protect client confidentiality.",
      highlights: ["AES-256 encryption", "GDPR compliant", "SOC 2 certified", "Auto file deletion"],
      gradient: "from-slate-600 to-slate-800",
      bgGradient: "from-slate-50 to-gray-50"
    },
    {
      icon: GitCompare,
      title: "Document Comparison",
      description: "Compare documents side-by-side with intelligent difference detection and professional redlining.",
      highlights: ["Track insertions", "Track deletions", "Change summaries", "Export reports"],
      gradient: "from-teal-500 to-cyan-500",
      bgGradient: "from-teal-50 to-cyan-50"
    },
    {
      icon: PenTool,
      title: "Annotation Tools",
      description: "Professional annotation and markup tools for collaborative legal document review.",
      highlights: ["Highlight text", "Add comments", "Bookmarks", "Export annotations"],
      gradient: "from-yellow-500 to-amber-500",
      bgGradient: "from-yellow-50 to-amber-50"
    },
    {
      icon: Package,
      title: "Batch Processing",
      description: "Upload and process multiple documents simultaneously for maximum efficiency.",
      highlights: ["Bulk conversion", "Progress tracking", "Batch download", "Queue management"],
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process documents in seconds with our optimized conversion algorithms and cloud infrastructure.",
      highlights: ["< 3 second conversion", "Real-time analysis", "Instant download", "No waiting queues"],
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50"
    },
    {
      icon: FileSearch,
      title: "Document Intelligence",
      description: "Extract metadata, identify document types, and categorize legal content automatically.",
      highlights: ["Auto-categorization", "Metadata extraction", "Content classification", "Smart search"],
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-50 to-green-50"
    }
  ];

  const additionalFeatures = [
    { icon: Globe, title: "Cloud-Based", description: "Access from anywhere, any device" },
    { icon: Clock, title: "24/7 Availability", description: "Process documents anytime" },
    { icon: Users, title: "Team Collaboration", description: "Share and collaborate securely" },
    { icon: Lock, title: "Privacy First", description: "Your documents stay private" },
    { icon: Layers, title: "Version Control", description: "Track document changes" },
    { icon: Download, title: "Easy Export", description: "Download in any format" }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-full text-sm font-medium text-blue-800 mb-6 shadow-sm">
              <Star className="h-4 w-4 mr-2 text-blue-600" />
              Trusted by 50,000+ Legal Professionals
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Legal Professionals</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10">
              Everything you need to streamline your legal document workflow—from conversion 
              and analysis to collaboration and security—all in one professional platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/#processor">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  Try Free Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" className="border-2 border-slate-300 text-slate-700 hover:bg-slate-100 px-8 py-4 text-lg font-semibold">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Main Features Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Complete Legal Document Solution
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Discover all the tools and features designed specifically for legal professionals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mainFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card 
                    key={index} 
                    className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 bg-gradient-to-br from-white to-slate-50/50 overflow-hidden"
                    data-testid={`feature-card-${index}`}
                  >
                    <CardHeader className={`pb-6 bg-gradient-to-br ${feature.bgGradient} border-b border-opacity-20`}>
                      <div className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ul className="space-y-3">
                        {feature.highlights.map((highlight, highlightIndex) => (
                          <li key={highlightIndex} className="flex items-center text-sm">
                            <div className={`p-1 rounded-full bg-gradient-to-r ${feature.gradient} mr-3`}>
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-slate-700 font-medium">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                And Much More...
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {additionalFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="text-center p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <IconComponent className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white shadow-2xl">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Transform Your Legal Workflow?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of legal professionals who trust LegalDocConverter for their document processing needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/#processor">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg">
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold">
                    View Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default FeaturesPage;
