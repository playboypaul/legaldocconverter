import React, { useEffect } from 'react';

const AdSenseAd = ({ 
  client = "ca-pub-8306818191166444",
  slot,
  style = { display: 'block' },
  format = "auto",
  responsive = true,
  className = ""
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
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      ></ins>
    </div>
  );
};

// Pre-configured ad components for different placements
export const BannerAd = ({ className = "my-8" }) => (
  <AdSenseAd
    slot="1234567890" // You'll need to replace with your actual ad slot ID
    style={{ display: 'block', width: '100%', height: '90px' }}
    format="horizontal"
    className={className}
  />
);

export const SquareAd = ({ className = "my-6" }) => (
  <AdSenseAd
    slot="1234567891" // You'll need to replace with your actual ad slot ID
    style={{ display: 'block', width: '300px', height: '250px' }}
    format="rectangle"
    className={className}
  />
);

export const SidebarAd = ({ className = "my-4" }) => (
  <AdSenseAd
    slot="1234567892" // You'll need to replace with your actual ad slot ID
    style={{ display: 'block', width: '160px', height: '600px' }}
    format="vertical"
    className={className}
  />
);

export default AdSenseAd;