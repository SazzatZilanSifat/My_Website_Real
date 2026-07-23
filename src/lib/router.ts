import { useState, useEffect, useCallback } from 'react';

export function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const onChange = () => {
      setRoute(window.location.hash.slice(1) || '/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return { route, navigate };
}

export function parseRoute(route: string): { page: string; params: Record<string, string> } {
  const clean = route.startsWith('/') ? route.slice(1) : route;
  const segments = clean.split('/').filter(Boolean);

  if (segments.length === 0) return { page: 'home', params: {} };
  if (segments[0] === 'properties') {
    if (segments.length === 1) return { page: 'properties', params: {} };
    return { page: 'property-detail', params: { id: segments[1] } };
  }
  if (segments[0] === 'blog') {
    if (segments.length === 1) return { page: 'blog', params: {} };
    return { page: 'blog-detail', params: { slug: segments[1] } };
  }
  if (segments[0] === 'agents') return { page: 'agents', params: {} };
  if (segments[0] === 'about') return { page: 'about', params: {} };
  if (segments[0] === 'contact') return { page: 'contact', params: {} };
  if (segments[0] === 'login') return { page: 'login', params: {} };
  if (segments[0] === 'signup') return { page: 'signup', params: {} };
  if (segments[0] === 'dashboard') return { page: 'dashboard', params: {} };
  if (segments[0] === 'organization') return { page: 'organization', params: {} };
  if (segments[0] === 'inquiries') return { page: 'inquiries', params: {} };

  return { page: 'home', params: {} };
}
