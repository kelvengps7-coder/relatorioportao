import { useEffect } from 'react';

export const PerformanceMonitor = () => {
  useEffect(() => {
    // Monitor performance em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`⚡ Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure'] });
      
      return () => observer.disconnect();
    }
  }, []);

  return null;
};