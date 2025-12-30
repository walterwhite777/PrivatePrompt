import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAppContext } from '../lib/AppContext';

const CheckPageDynamic = dynamic(() => import('../components/CheckPage'), { ssr: false });

export default function Home() {
  const { checkingOllama, ollamaInstalled, checkOllamaPresence } = useAppContext();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    console.log('index.jsx mounted - checkingOllama:', checkingOllama, 'ollamaInstalled:', ollamaInstalled, 'current path:', router.pathname);
    if (!checkingOllama && ollamaInstalled && router.pathname === '/' && !hasRedirectedRef.current) {
      console.log('Redirecting to /models in 1000ms');
      hasRedirectedRef.current = true;
      setTimeout(() => {
        router.push('/Models').catch((err) => {
          console.error('Redirect to /models failed:', err);
          hasRedirectedRef.current = false; // Allow retry on error
        });
      }, 1000);
    }
  }, [checkingOllama, ollamaInstalled, router]);

  return <CheckPageDynamic onOllamaCheck={checkOllamaPresence} checking={checkingOllama} />;
}