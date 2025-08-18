import React, { useEffect } from 'react';

const AdSenseAd = ({ 
  client = "ca-pub-8306818191166444",
  slot,
  style = { display: 'block' },
  format = "auto",
  responsive = true,
  className = "",
  title = "Advertisement"
}) => {
  useEffect(() => {
    try {
      // Load AdSense ads
      if (window.adsbygoogle && window.adsbygoogle.push) {
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`}>
      {/* Publisher Content - Required by AdSense Policy */}
      <div className="ad-context-content mb-2">
        <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
        <p className="text-xs text-gray-500">
          Supporting legal professionals with trusted document conversion tools
        </p>
      </div>
      
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      ></ins>
      
      {/* Additional Publisher Content */}
      <div className="ad-context-footer mt-2">
        <p className="text-xs text-gray-400">
          Advertisements help us provide free document conversion services
        </p>
      </div>
    </div>
  );
};

// AdSense-compliant ad components with proper publisher content
export const BannerAd = ({ className = "my-8" }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
    <div className="text-center mb-4">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">
        Trusted by Legal Professionals Worldwide
      </h3>
      <p className="text-blue-700 text-sm">
        Our document conversion platform has processed over 1 million legal documents
      </p>
    </div>
    
    <AdSenseAd
      slot="1234567890" // Replace with actual ad slot ID
      style={{ display: 'block', width: '100%', height: '90px' }}
      format="horizontal"
      className={className}
      title="Legal Tech Solutions"
    />
    
    <div className="text-center mt-4">
      <p className="text-xs text-blue-600">
        Secure • Fast • Professional • Compliant with legal industry standards
      </p>
    </div>
  </div>
);

export const SquareAd = ({ className = "my-6" }) => (
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
    <div className="mb-3">
      <h4 className="text-md font-medium text-gray-800 mb-2">
        Professional Document Tools
      </h4>
      <p className="text-sm text-gray-600">
        Convert, analyze, and process legal documents with AI-powered insights
      </p>
    </div>
    
    <AdSenseAd
      slot="1234567891" // Replace with actual ad slot ID
      style={{ display: 'block', width: '300px', height: '250px' }}
      format="rectangle"
      className={className}
      title="Legal Services"
    />
    
    <div className="mt-3">
      <p className="text-xs text-gray-500">
        Join thousands of lawyers using our platform for document management
      </p>
    </div>
  </div>
);

export const SidebarAd = ({ className = "my-4" }) => (
  <div className="bg-gradient-to-b from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
    <div className="mb-3">
      <h4 className="text-sm font-medium text-green-800 mb-1">
        Legal Document Solutions
      </h4>
      <p className="text-xs text-green-700">
        Streamline your legal workflow with our comprehensive document tools
      </p>
    </div>
    
    <AdSenseAd
      slot="1234567892" // Replace with actual ad slot ID
      style={{ display: 'block', width: '160px', height: '600px' }}
      format="vertical"
      className={className}
      title="Professional Services"
    />
    
    <div className="mt-3">
      <p className="text-xs text-green-600">
        Trusted by law firms, corporate legal teams, and independent practitioners
      </p>
    </div>
  </div>
);

// Content-rich ad component for better policy compliance
export const ContentRichAd = ({ className = "my-8", topic = "Legal Technology" }) => (
  <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
    <div className="text-center mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3">
        {topic} Resources
      </h2>
      <p className="text-gray-700 mb-4">
        Discover the latest tools and insights for legal professionals. Our platform
        combines cutting-edge AI technology with practical document management solutions
        to help legal teams work more efficiently.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900">Secure Processing</h4>
          <p className="text-sm text-blue-700">Bank-level encryption</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-900">AI Analysis</h4>
          <p className="text-sm text-green-700">Advanced legal insights</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-900">Multi-format</h4>
          <p className="text-sm text-purple-700">All document types</p>
        </div>
      </div>
    </div>
    
    <AdSenseAd
      slot="1234567893" // Replace with actual ad slot ID
      style={{ display: 'block', width: '100%', height: '280px' }}
      format="rectangle"
      className={className}
      title={`${topic} Advertisement`}
    />
    
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600 mb-2">
        Learn more about how legal technology is transforming the industry
      </p>
      <div className="flex justify-center space-x-4 text-xs text-gray-500">
        <span>✓ GDPR Compliant</span>
        <span>✓ SOC 2 Certified</span>
        <span>✓ 99.9% Uptime</span>
      </div>
    </div>
  </div>
);

export default AdSenseAd;