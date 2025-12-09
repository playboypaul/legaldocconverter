import React, { useState } from 'react';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import CookiePolicy from './CookiePolicy';
import SecurityPage from './SecurityPage';

const LegalModalManager = () => {
  const [activeModal, setActiveModal] = useState(null);

  const openTerms = () => setActiveModal('terms');
  const openPrivacy = () => setActiveModal('privacy');
  const openCookies = () => setActiveModal('cookies');
  const openSecurity = () => setActiveModal('security');
  const closeModal = () => setActiveModal(null);

  // Expose functions globally so they can be called from anywhere
  React.useEffect(() => {
    window.openTermsOfService = openTerms;
    window.openPrivacyPolicy = openPrivacy;
    window.openCookiePolicy = openCookies;
    window.openSecurityPage = openSecurity;
    
    return () => {
      delete window.openTermsOfService;
      delete window.openPrivacyPolicy;
      delete window.openCookiePolicy;
      delete window.openSecurityPage;
    };
  }, []);

  if (activeModal === 'terms') {
    return <TermsOfService onBack={closeModal} />;
  }

  if (activeModal === 'privacy') {
    return <PrivacyPolicy onBack={closeModal} />;
  }

  if (activeModal === 'cookies') {
    return <CookiePolicy onBack={closeModal} />;
  }

  if (activeModal === 'security') {
    return <SecurityPage onBack={closeModal} />;
  }

  return null;
};

export default LegalModalManager;