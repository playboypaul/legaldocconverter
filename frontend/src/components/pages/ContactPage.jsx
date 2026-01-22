import React, { useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import { Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would send to an email service
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Get in <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Touch</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Have questions about our platform? Need help with your subscription? 
              We're here to assist you.
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Contact Info */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-8">Contact Information</h2>
                
                <div className="space-y-8">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Email Support</h3>
                      <p className="text-slate-600">support@legaldocconverter.com</p>
                      <p className="text-sm text-slate-500 mt-1">We typically respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Location</h3>
                      <p className="text-slate-600">Alberta, Canada</p>
                      <p className="text-sm text-slate-500 mt-1">Serving legal professionals worldwide</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Support Hours</h3>
                      <p className="text-slate-600">Monday - Friday: 9AM - 6PM MST</p>
                      <p className="text-sm text-slate-500 mt-1">Emergency support available 24/7 for Pro users</p>
                    </div>
                  </div>
                </div>

                {/* FAQ Quick Links */}
                <div className="mt-12 p-6 bg-white rounded-xl shadow-lg">
                  <h3 className="font-semibold text-slate-900 mb-4">Common Questions</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="/pricing" className="text-blue-600 hover:text-blue-800 transition-colors">
                        → What's included in the Professional plan?
                      </a>
                    </li>
                    <li>
                      <a href="/features" className="text-blue-600 hover:text-blue-800 transition-colors">
                        → What file formats do you support?
                      </a>
                    </li>
                    <li>
                      <a href="/security" className="text-blue-600 hover:text-blue-800 transition-colors">
                        → How is my data protected?
                      </a>
                    </li>
                    <li>
                      <a href="/privacy" className="text-blue-600 hover:text-blue-800 transition-colors">
                        → What's your privacy policy?
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
                
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Message Sent!</h3>
                    <p className="text-slate-600 text-center">
                      Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Name
                      </label>
                      <Input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="John Smith"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@lawfirm.com"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Subject
                      </label>
                      <Input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        placeholder="Question about..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Message
                      </label>
                      <textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="How can we help you?"
                        rows={5}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 text-lg font-semibold"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Enterprise Solutions</h2>
            <p className="text-xl text-slate-600 mb-8">
              Looking for a custom solution for your law firm or legal department? 
              Our enterprise team can help with custom integrations, volume pricing, and dedicated support.
            </p>
            <a 
              href="mailto:enterprise@legaldocconverter.com"
              className="inline-flex items-center bg-slate-800 hover:bg-slate-900 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-colors"
            >
              Contact Enterprise Sales
            </a>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;
