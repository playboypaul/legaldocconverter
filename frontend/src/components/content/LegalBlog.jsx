import React from 'react';
import { Link } from 'react-router-dom';
import { articles, legalNews } from './articlesData';
import { LegalDocumentGuideWithAd, LegalTechReportWithAd } from '../ads/AdSenseAd';
import Header from '../Header';
import Footer from '../Footer';

const LegalBlog = () => {
  const blogPosts = articles;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Legal Technology & Document Management Blog
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Expert insights, industry trends, and practical guidance for legal professionals 
              navigating the digital transformation of legal practice.
            </p>
          </div>

          {/* Blog Posts Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
              Latest Articles & Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-gray-500 text-sm">{post.readTime}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                      <Link to={`/blog/${post.id}`}>
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-gray-500 text-sm">{post.date}</span>
                      <Link 
                        to={`/blog/${post.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Featured Content with Ads */}
          <LegalDocumentGuideWithAd />

          {/* Industry Report with Ad */}
          <LegalTechReportWithAd />

        {/* Additional Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Legal Resources */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Free Legal Resources
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900">Document Templates</h4>
                <p className="text-gray-600 text-sm">Professional legal document templates for common practice areas</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900">Compliance Checklists</h4>
                <p className="text-gray-600 text-sm">Essential checklists for legal document compliance and security</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-gray-900">Format Conversion Guides</h4>
                <p className="text-gray-600 text-sm">Step-by-step guides for professional document format conversion</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-gray-900">AI Analysis Tools</h4>
                <p className="text-gray-600 text-sm">Comprehensive guides to AI-powered legal document analysis</p>
              </div>
            </div>
          </div>

          {/* Industry News */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Latest Legal Industry News
            </h3>
            <div className="space-y-6">
              {legalNews.map((news, index) => (
                <div key={index} className="pb-4 border-b border-gray-200 last:border-0">
                  <Link to={news.url} className="block hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                    <h4 className="font-semibold text-gray-900 mb-2 hover:text-blue-600">
                      {news.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-2">
                      {news.excerpt}
                    </p>
                    <span className="text-blue-600 text-xs">{news.date} →</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Stay Updated with Legal Tech Trends
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Get weekly insights on legal technology, document management best practices, 
            and industry developments delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalBlog;