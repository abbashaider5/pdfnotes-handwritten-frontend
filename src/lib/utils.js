import { useEffect } from 'react';

// Page Title Hook
export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} | PDF Store`;
  }, [title]);
}
