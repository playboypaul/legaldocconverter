import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, Star, Sparkles, HelpCircle, Shield, Zap, Users, Clock } from 'lucide-react';

const PricingPage = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "month",
      description: "Perfect for trying out our services",
      popular: false,
      features: [
        "3 document uploads per month",
        "1 AI analysis per month",
        "All conversion formats (30+)",
        "PDF tools (merge, split, encrypt)",
        "Document comparison",
        "Batch processing (up to 5 files)",
        "Annotation tools",
        "Email support"
      ],
      limitations: [
        "Limited uploads",
        "Basic AI features",
        "No API access"
      ],
      cta: "Start Free",
      ctaAction: () => window.location.href = '/#processor'
    },
    {
      name: "Professional",
      price: "$49.99",
      period: "month",
      description: "For legal professionals and firms",
      popular: true,
      features: [
        "Unlimited document uploads",
        "Unlimited AI analysis",
        "All conversion formats (30+)",
        "Advanced PDF toolkit",
        "Priority document processing",
        "Unlimited batch processing",
        "Advanced annotation & collaboration",
        "Digital signature templates",
        "Custom branding options",
        "Priority email & chat support",
        "API access for integrations",
        "Dedicated account manager"
      ],
      limitations: [],
      cta: "Subscribe Now",
      ctaAction: () => window.open('https://buy.stripe.com/5kQfZh7EU65I6Q61i65AQ0V', '_blank')
    }
  ];

  const faqs = [
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer: "Yes! You can upgrade to Professional at any time to unlock unlimited features. If you need to downgrade, changes take effect at the end of your billing cycle."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor. Enterprise clients can also pay via invoice."
    },
    {
      question: "Is there a long-term contract?",
      answer: "No long-term contracts required. The Professional plan is billed monthly and you can cancel anytime. We also offer annual plans with 2 months free."
    },
    {
      question: "What happens to my documents if I cancel?",
      answer: "Your documents are automatically deleted after processing for security. If you have saved annotations or analysis reports, you can export them before canceling."
    },
    {
      question: "Do you offer enterprise pricing?",
      answer: "Yes! For organizations with 10+ users or specific compliance requirements, we offer custom enterprise plans with volume discounts, dedicated support, and custom integrations."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-grade AES-256 encryption, are GDPR compliant, and SOC 2 certified. Documents are processed securely and automatically deleted after conversion."
    }
  ];

  const comparisonFeatures = [
    { feature: "Document Uploads", free: "3/month", pro: "Unlimited" },
    { feature: "AI Analysis", free: "1/month", pro: "Unlimited" },
    { feature: "Conversion Formats", free: "30+", pro: "30+" },
    { feature: "PDF Tools", free: "Basic", pro: "Advanced" },
    { feature: "Batch Processing", free: "5 files", pro: "Unlimited" },
    { feature: "Document Comparison", free: "Yes", pro: "Yes" },
    { feature: "Annotations", free: "Basic", pro: "Advanced" },
    { feature: "API Access", free: "No", pro: "Yes" },
    { feature: "Priority Support", free: "No", pro: "Yes" },
    { feature: "Custom Branding", free: "No", pro: "Yes" }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 rounded-full text-sm font-medium text-blue-800 mb-6 shadow-sm">
              <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
              Choose the Plan That
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Fits Your Needs</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Start free and upgrade as your legal document processing needs grow. 
              No hidden fees, cancel anytime.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`group relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden ${
                    plan.popular 
                      ? 'ring-4 ring-blue-200 scale-105 bg-gradient-to-br from-white to-blue-50' 
                      : 'bg-gradient-to-br from-white to-slate-50'
                  }`}
                  data-testid={`pricing-card-${plan.name.toLowerCase()}`}
                >
                  {plan.popular && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 text-sm font-bold shadow-lg">
                          <Star className="h-4 w-4 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    </>
                  )}
                  
                  <CardHeader className={`text-center pb-8 relative z-10 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white pt-10' 
                      : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
                  } rounded-t-lg`}>
                    <CardTitle className="text-2xl font-bold">
                      {plan.name}
                    </CardTitle>
                    <div className="mt-6">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-lg opacity-80">/{plan.period}</span>
                    </div>
                    <CardDescription className={`mt-3 ${
                      plan.popular ? 'text-blue-100' : 'text-slate-300'
                    }`}>
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-8 p-8 relative z-10">
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <div className={`p-1 rounded-full mr-4 mt-1 ${
                            plan.popular 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          } flex-shrink-0`}>
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-slate-700 font-medium leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.limitations && plan.limitations.length > 0 && (
                      <div className="pt-6 border-t border-slate-200">
                        <p className="text-sm font-medium text-slate-500 mb-3">Limitations:</p>
                        <ul className="space-y-2">
                          {plan.limitations.map((limitation, limitIndex) => (
                            <li key={limitIndex} className="text-sm text-slate-500 flex items-center">
                              <div className="w-2 h-2 bg-slate-400 rounded-full mr-3 flex-shrink-0"></div>
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button 
                      className={`w-full py-4 font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' 
                          : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white'
                      }`}
                      onClick={plan.ctaAction}
                      data-testid={`pricing-cta-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                      {plan.popular && <Sparkles className="ml-2 h-5 w-5" />}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
              Feature Comparison
            </h2>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Free</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-blue-600">Professional</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.feature}</td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600">{item.free}</td>
                      <td className="px-6 py-4 text-center text-sm text-blue-600 font-semibold">{item.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-6">
                <Shield className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900">Bank-Grade Security</h3>
                <p className="text-sm text-slate-600">AES-256 encryption</p>
              </div>
              <div className="p-6">
                <Zap className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900">Lightning Fast</h3>
                <p className="text-sm text-slate-600">3-second conversions</p>
              </div>
              <div className="p-6">
                <Users className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900">50,000+ Users</h3>
                <p className="text-sm text-slate-600">Trusted worldwide</p>
              </div>
              <div className="p-6">
                <Clock className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900">24/7 Available</h3>
                <p className="text-sm text-slate-600">Process anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* Money Back Guarantee */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-500 rounded-full">
                  <Check className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">30-Day Money-Back Guarantee</h3>
              <p className="text-green-700 text-lg">
                Not satisfied? Get a full refund within 30 days—no questions asked.
              </p>
              <p className="text-sm text-green-600 mt-2">
                Cancel anytime • No hidden fees • Instant refund processing
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-600">
                Have questions? We have answers.
              </p>
            </div>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start">
                    <HelpCircle className="h-6 w-6 text-blue-600 mr-4 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.question}</h3>
                      <p className="text-slate-600">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-12 text-white text-center shadow-2xl">
              <h2 className="text-3xl font-bold mb-4">
                Need an Enterprise Solution?
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                For organizations with 10+ users or specific compliance requirements, 
                we offer custom enterprise plans with volume discounts and dedicated support.
              </p>
              <Button 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-slate-900 px-8 py-4 text-lg font-semibold transition-all duration-300"
                onClick={() => window.location.href = 'mailto:enterprise@legaldocconverter.com'}
              >
                Contact Sales Team
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default PricingPage;
