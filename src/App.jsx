


import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import './App.css';
import Navbar from './Navbar';
import HomeSection from './HomeSection';
import { sections } from './sections';
// other pages load only when opened, so the Home page appears faster
const AboutSection = lazy(() => import('./AboutSection'));
const Team = lazy(() => import('./team'));
const EventsSection = lazy(() => import('./EventsSection'));
const BlogsSection = lazy(() => import('./BlogsSection'));
const ThinkXSection = lazy(() => import('./ThinkXSection'));


function App() {
  // Start on the section in the URL hash (so a page refresh stays on the same tab)
  const [section, setSection] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return sections.some(s => s.key === hash) ? hash : 'home';
  });
  const [thinkxTab, setThinkxTab] = useState(null);
  const selectSection = useCallback(key => setSection(key), []);

  // Go to a section (and optionally a Think-X sub tab), keeping the URL hash in sync
  const navigate = (key, tab) => {
    setSection(key);
    if (key === 'thinkx') setThinkxTab({ tab: tab || 'overview', at: Date.now() });
    window.history.pushState(null, null, key === 'home' ? window.location.pathname : `#${key}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle initial URL hash and browser back/forward navigation
  useEffect(() => {
    // Function to handle URL hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && sections.some(s => s.key === hash)) {
        setSection(hash);
      } else if (!hash) {
        setSection('home');
      }
    };

    // Handle initial load
    handleHashChange();

    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', handleHashChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      overflowX: 'hidden', 
      color: '#ffffff', 
      fontFamily: 'JetBrains Mono, Fira Mono, Georgia, serif', // changed font
      position: 'relative',
      background: '#111',
    }}>
      <Navbar section={section} setSection={selectSection} sections={sections} />
      <div style={{ height: 70 }} />
      {section === 'home' && <HomeSection onNavigate={navigate} />}
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      {section === 'about' && <AboutSection />}
      {section === 'team' && <Team />}
      {section === 'blogs' && <BlogsSection />}
      {section === 'events' && <EventsSection />}
      {section === 'thinkx' && <ThinkXSection initialTab={thinkxTab} />}
      </Suspense>
      <footer style={{ 
        textAlign: 'center', 
        color: '#60a5fa', 
        padding: '2rem 0 1rem', 
        fontSize: 18, 
        letterSpacing: 1, 
        marginTop: 40,
        textShadow: '0 0 5px rgba(96, 165, 250, 0.6)',
        background: 'linear-gradient(135deg, rgba(16, 16, 16, 0.9) 0%, rgba(24, 24, 32, 0.9) 100%)',
        borderTop: '1px solid rgba(96, 165, 250, 0.2)'
      }}>
        {/* Social Media Links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <a 
            href="https://www.instagram.com/cognitron_ai?igsh=MTdwZnptMzZlN2NneA=="
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#E4405F',
              fontSize: '1.2rem',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '2px solid #E4405F',
              background: 'rgba(228, 64, 95, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.background = 'rgba(228, 64, 95, 0.2)';
              e.target.style.boxShadow = '0 0 15px rgba(228, 64, 95, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.background = 'rgba(228, 64, 95, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Instagram
          </a>
          
          <a 
            href="https://www.linkedin.com/in/cognitron-technical-club-of-ai-b65512376?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#0077B5',
              fontSize: '1.2rem',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '2px solid #0077B5',
              background: 'rgba(0, 119, 181, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.background = 'rgba(0, 119, 181, 0.2)';
              e.target.style.boxShadow = '0 0 15px rgba(0, 119, 181, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.background = 'rgba(0, 119, 181, 0.1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
        </div>
        
        <div style={{ fontSize: '1rem', opacity: 0.8 }}>
          &copy; {new Date().getFullYear()} AI Cognitron Club | AI & DS Department
        </div>
      </footer>
    </div>
  );
}


// Helper functions for modern theme
function getModernColor() {
  const colors = ['#3b83f6', '#60a5fa', '#93c4fd', '#2564eb', '#1d4fd8'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateSubtleBinary() {
  return Array.from({ length: 15 }, () => Math.random() > 0.7 ? '1' : '0').join('');
}

export default App;
