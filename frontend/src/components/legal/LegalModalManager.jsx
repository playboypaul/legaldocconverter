import React, { useState } from 'react';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';

const LegalModalManager = () => {
  const [activeModal, setActiveModal] = useState(null);

  const openTerms = () => setActiveModal('terms');
  const openPrivacy = () => setActiveModal('privacy');
  const closeModal = () => setActiveModal(null);

  // Expose functions globally so they can be called from anywhere
  React.useEffect(() => {
    window.openTermsOfService = openTerms;
    window.openPrivacyPolicy = openPrivacy;
    
    return () => {
      delete window.openTermsOfService;
      delete window.openPrivacyPolicy;
    };
  }, []);

  if (activeModal === 'terms') {
    return <TermsOfService onBack={closeModal} />;
  }

  if (activeModal === 'privacy') {
    return <PrivacyPolicy onBack={closeModal} />;
  }

  return null;
};

export default LegalModalManager;