import introJs from 'intro.js';
import { useEffect } from 'react';

const STORAGE_KEY = 'dashboardTourCompleted';

export function useDashboardTour() {
  useEffect(() => {
    const tourCompleted = localStorage.getItem(STORAGE_KEY);
    
    if (tourCompleted === 'true') {
      return;
    }

    const timer = setTimeout(() => {
      startTour();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const startTour = () => {
    const intro = introJs();

    const steps = [
      {
        element: '#dashboard-sidebar',
        intro: 'This is your main navigation panel to manage PDFs, users, orders, analytics, and settings.',
        position: 'right',
      },
      {
        element: '#menu-dashboard',
        intro: 'Dashboard overview showing key platform statistics.',
        position: 'right',
      },
      {
        element: '#menu-upload-pdf',
        intro: 'Upload and publish new PDFs to sell on your platform.',
        position: 'right',
      },
      {
        element: '#menu-my-pdfs',
        intro: 'Manage your uploaded PDFs — edit, activate, or deactivate them.',
        position: 'right',
      },
      {
        element: '#menu-categories',
        intro: 'Organize PDFs using categories and subjects for better discovery.',
        position: 'right',
      },
      {
        element: '#menu-subjects',
        intro: 'Manage subject classifications for your PDFs.',
        position: 'right',
      },
      {
        element: '#menu-orders',
        intro: 'View and manage all customer orders.',
        position: 'right',
      },
      {
        element: '#menu-users',
        intro: 'Manage registered users and their activity.',
        position: 'right',
      },
      {
        element: '#menu-author-requests',
        intro: 'Approve or reject author account requests.',
        position: 'right',
      },
      {
        element: '#menu-analytics',
        intro: 'Track sales, revenue, and performance analytics.',
        position: 'right',
      },
      {
        element: '#menu-settings',
        intro: 'Configure platform and account settings.',
        position: 'right',
      },
      {
        element: '#dashboard-stats',
        intro: 'These cards show a quick snapshot of your total PDFs, sales, revenue, and active items.',
        position: 'bottom',
      },
      {
        element: '#sales-chart',
        intro: 'Track your sales performance over time.',
        position: 'bottom',
      },
      {
        element: '#recent-orders',
        intro: 'See your most recent customer orders here.',
        position: 'left',
      },
      {
        intro: "You're all set! Start managing your PDF store 🚀",
      },
    ];

    intro
      .setOptions({
        steps: steps,
        nextLabel: 'Next',
        prevLabel: 'Back',
        skipLabel: 'Skip Tour',
        doneLabel: 'Finish',
        showProgress: true,
        showStepNumbers: true,
        showBullets: false,
        exitOnOverlayClick: false,
        exitOnEsc: true,
        keyboardNavigation: true,
        scrollToElement: true,
        scrollPadding: 10,
        helperElementPadding: 10,
        disableInteraction: true,
        overlayOpacity: 0.75,
      })
      .oncomplete(() => {
        localStorage.setItem(STORAGE_KEY, 'true');
      })
      .onexit(() => {
        localStorage.setItem(STORAGE_KEY, 'true');
      })
      .onbeforechange((element) => {
        if (element) {
          // Check if element is in sidebar
          const sidebar = document.getElementById('dashboard-sidebar');
          if (sidebar && sidebar.contains(element)) {
            sidebar.scrollTo({ behavior: 'smooth', top: element.offsetTop - 100 });
          } else {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      })
      .start();
  };

  return null;
}

export function resetDashboardTour() {
  localStorage.removeItem(STORAGE_KEY);
}
