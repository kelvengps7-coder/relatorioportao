
import { useEffect } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure a aparência da barra de progresso
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  easing: 'ease',
  speed: 500,
});

const LoadingIndicator = () => {
  useEffect(() => {
    NProgress.start();
    
    return () => {
      NProgress.done();
    };
  }, []);

  return null; // Este componente não renderiza nada no DOM
};

export default LoadingIndicator;
