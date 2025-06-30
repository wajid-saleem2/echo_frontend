// frontend/src/services/analytics.js
import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      // You can add testMode: process.env.NODE_ENV === 'development'
      // to prevent sending hits from your local dev environment.
      // However, for initial setup, it's often useful to see hits from localhost.
      // testMode: process.env.NODE_ENV === 'development',
    });
    console.log("GA Initialized with ID:", GA_MEASUREMENT_ID);
  } else {
    console.warn("GA_MEASUREMENT_ID not found. GA not initialized.");
  }
};

// Track page views
export const trackPageView = (path) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: "pageview", page: path, title: document.title });
    // For GA4, pageview is often sent automatically with the config,
    // but explicit sending gives more control or can be used if auto is disabled.
    // ReactGA.pageview(path) is also an option from older versions,
    // but ReactGA.send is more aligned with GA4's event model.
    console.log(`GA Pageview: ${path}`);
  }
};

// Track custom events
export const trackEvent = (category, action, label, value) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category: category, // e.g., 'User Interaction'
      action: action,     // e.g., 'Clicked Login Button'
      label: label,       // (optional) e.g., 'Login Page'
      value: value        // (optional) e.g., number of items
    });
    console.log(`GA Event: Category=${category}, Action=${action}, Label=${label}`);
  }
};

// You can add more specific event tracking functions here
// e.g., trackUserLogin, trackContentCreation, etc.
export const trackUserRegistration = () => {
    trackEvent('User', 'Registration', 'Success');
};

export const trackUserLogin = () => {
    trackEvent('User', 'Login', 'Success');
};

export const trackContentCreated = (contentType) => {
    trackEvent('Content', 'Created', contentType);
};

export const trackSnippetGenerated = (platform) => {
    trackEvent('Repurpose', 'Generated Snippet', platform);
};