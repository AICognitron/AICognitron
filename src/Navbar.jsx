import React, { useState, useEffect, useRef } from 'react';
import { GiHamburgerMenu } from "react-icons/gi";
import { MdClose } from "react-icons/md";

// Fix: import as image path, not as component
import CognitronLogo from './assets/cognitron.png';

const Navbar = ({ section, setSection, sections }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900); // Set initial value immediately
  const mobileMenuRef = useRef(null);
  const hamburgerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false); // Close mobile menu when switching to desktop
      }
    };

    // Set initial value
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle URL changes and persist section in URL
  useEffect(() => {
    // Get section from URL hash on component mount
    const hash = window.location.hash.replace('#', '');
    if (hash && sections.some(s => s.key === hash)) {
      setSection(hash);
    }
  }, [setSection, sections]);

  // Update URL when section changes
  useEffect(() => {
    if (section && section !== 'home') {
      window.history.replaceState(null, null, `#${section}`);
    } else {
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, [section]);

  // Keyboard accessibility for mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus first menu item when opening
      setTimeout(() => {
        const firstMenuItem = mobileMenuRef.current?.querySelector('button');
        firstMenuItem?.focus();
      }, 100);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleSectionChange = (newSection) => {
    setSection(newSection);
    // Update URL immediately
    if (newSection && newSection !== 'home') {
      window.history.pushState(null, null, `#${newSection}`);
    } else {
      window.history.pushState(null, null, window.location.pathname);
    }
  };

  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: scrolled ? '60px' : '72px',
      background: 'rgba(17, 25, 40, 0.96)', // solid background (blur effects made scrolling slow)
      borderBottom: '1.5px solid rgba(255, 255, 255, 0.2)', // fallback border
      boxShadow: '0 4px 24px 0 rgba(31, 38, 135, 0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2.5rem',
      zIndex: 1000,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Logo and Cognitron symbol */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
        cursor: 'pointer',
      }} onClick={() => handleSectionChange('home')}>
        {/* Use <img> for logo */}
        <img
          src={CognitronLogo}
          alt="Cognitron Logo"
          style={{
            height: scrolled ? '40px' : '58px',
            width: 'auto',
            background: 'white',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 2px 8px #6c63ff22',
            transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: 'drop-shadow(0 2px 8px #6c63ff44)'
          }}
        />
        <span className="navbar-logo" style={{
          fontSize: scrolled ? '1.5rem' : '1.8rem',
          color: '#3b82f6', // fallback blue color
          fontWeight: 800,
          letterSpacing: '2px',
          fontFamily: 'JetBrains Mono, monospace',
          textShadow: '0 2px 12px #6c63ff44',
        }}>AICOGNITRON</span>
      </div>
      {/* Desktop Navigation */}
      <div className="navbar-desktop" style={{
        display: (isMobile || window.innerWidth <= 900) ? 'none' : 'flex', // Double check condition
        gap: '1.2rem',
        alignItems: 'center',
      }}>
        {sections.map(({ key, label }, index) => (
          <NavButton
            key={key}
            isActive={section === key}
            onClick={() => handleSectionChange(key)}
            delay={index * 0.1}
            scrolled={scrolled}
          >
            {label}
          </NavButton>
        ))}
      </div>
      {/* Mobile Hamburger Icon */}
      <button
        ref={hamburgerRef}
        className="navbar-mobile"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setMobileMenuOpen(!mobileMenuOpen);
          }
        }}
        style={{
          background: mobileMenuOpen 
            ? '#3b82f6' // fallback blue color 
            : 'rgba(17, 25, 40, 0.85)', // fallback background
          border: '1.5px solid rgba(255, 255, 255, 0.2)', // fallback border
          borderRadius: '10px',
          width: '44px',
          height: '44px',
          display: 'flex', // Temporarily always show to test
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: mobileMenuOpen ? '#fff' : '#3b82f6', // fallback colors
          fontSize: '1.5rem',
          marginLeft: '1rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          zIndex: 1001,
          fontFamily: 'inherit', // Ensure font loads properly
        }}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-menu"
      >
        {mobileMenuOpen ? (
          <span style={{fontSize: '1.5rem', lineHeight: 1}}>✕</span>
        ) : (
          <span style={{fontSize: '1.5rem', lineHeight: 1}}>☰</span>
        )}
      </button>
      {/* Mobile Menu Overlay */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={`mobile-menu-overlay glass ${mobileMenuOpen ? 'menu-open' : 'menu-closed'}`}
        style={{
          position: 'fixed',
          top: scrolled ? '60px' : '72px',
          left: 0,
          right: 0,
          background: 'rgba(17, 25, 40, 0.95)', // fallback background,
          padding: '2rem 1rem',
          zIndex: 999,
          borderTop: '1.5px solid rgba(255, 255, 255, 0.2)', // fallback border
          transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
          opacity: mobileMenuOpen ? 1 : 0,
          visibility: mobileMenuOpen ? 'visible' : 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: mobileMenuOpen ? '500px' : '0',
          overflow: 'hidden'
        }}
        aria-hidden={!mobileMenuOpen}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          maxWidth: '320px',
          margin: '0 auto',
          transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s'
        }}>
          {sections.map(({ key, label }, index) => (
            <MobileNavButton
              key={key}
              isActive={section === key}
              onClick={() => {
                handleSectionChange(key);
                setMobileMenuOpen(false);
              }}
              delay={index * 0.1}
              tabIndex={mobileMenuOpen ? 0 : -1}
            >
              {label}
            </MobileNavButton>
          ))}
        </div>
      </div>
      {/* Mobile Menu Backdrop */}
      <div
        className={`mobile-backdrop ${mobileMenuOpen ? 'backdrop-open' : 'backdrop-closed'}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10,16,38,0.7)',
          zIndex: 998,
          opacity: mobileMenuOpen ? 1 : 0,
          visibility: mobileMenuOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease'
        }}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <style>{`
        /* Enhanced Animations */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInMobile {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes menuSlideIn {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Mobile Menu States */
        .menu-open {
          animation: menuSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .menu-closed {
          animation: menuSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) reverse;
        }

        /* Focus styles for accessibility */
        .navbar-mobile:focus {
          outline: 2px solid #60a5fa;
          outline-offset: 2px;
        }

        /* Enhanced responsive breakpoints */
        @media (max-width: 900px) {
          .navbar-desktop {
            display: none !important;
          }
          .navbar-mobile {
            display: flex !important;
          }
        }

        /* Force hamburger to show on mobile */
        @media (max-width: 900px) {
          button.navbar-mobile {
            display: flex !important;
          }
          div.navbar-desktop {
            display: none !important;
          }
        }

        /* Ensure hamburger shows on smaller screens */
        @media (max-width: 768px) {
          .navbar-desktop {
            display: none !important;
          }
          .navbar-mobile {
            display: flex !important;
          }
          button.navbar-mobile {
            display: flex !important;
          }
        }

        @media (max-width: 480px) {
          nav {
            padding: 0 1rem !important;
          }
          .navbar-logo {
            font-size: 1.2rem !important;
          }
        }

        /* Smooth transitions for all interactive elements */
        button, a {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Enhanced glass morphism effect */
        .glass {

          background: rgba(17, 25, 40, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.125);
        }

        /* Improved hover states */
        @media (hover: hover) {
          button:hover {
            transform: translateY(-1px);
          }
          
          .navbar-mobile:hover {
            transform: scale(1.05) !important;
          }
        }
      `}</style>
    </nav>
  );
};

// Enhanced neon navigation button component
function NavButton({ children, isActive, onClick, delay, scrolled }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        background: isActive 
          ? 'rgba(59, 130, 246, 0.2)' 
          : isHovered 
            ? 'rgba(59, 130, 246, 0.1)' 
            : 'transparent',
        color: isActive ? '#60a5fa' : isHovered ? '#3b82f6' : '#e5e7eb',
        border: `1px solid ${isActive ? '#3b82f6' : isHovered ? '#60a5fa' : 'rgba(229, 231, 235, 0.3)'}`,
        padding: scrolled ? '0.5rem 1rem' : '0.6rem 1.2rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: scrolled ? '0.85rem' : '0.9rem',
        fontWeight: isActive ? '600' : '500',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        letterSpacing: '0.5px',
        position: 'relative',
        overflow: 'hidden',
        animation: `slideIn 0.6s ease-out ${delay}s both`,
        transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isActive 
          ? '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
          : isHovered 
            ? '0 4px 8px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      }}
      aria-pressed={isActive}
      role="button"
      tabIndex={0}
    >
      <span style={{
        position: 'relative',
        zIndex: 1
      }}>
        {children}
      </span>
      {/* Animated background effect */}
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isHovered ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.1))' : 'transparent',
        transition: 'all 0.3s ease',
        borderRadius: '8px'
      }} />
    </button>
  );
}

// Mobile navigation button component with enhanced accessibility
function MobileNavButton({ children, isActive, onClick, delay, tabIndex }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={tabIndex}
      style={{
        background: isActive 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(96, 165, 250, 0.2))' 
          : isHovered || isFocused
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(96, 165, 250, 0.1))' 
            : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.05))',
        color: isActive ? '#60a5fa' : '#e5e7eb',
        border: `2px solid ${isActive ? '#3b82f6' : isFocused ? '#60a5fa' : 'rgba(59, 130, 246, 0.4)'}`,
        padding: '1.2rem 1.8rem',
        borderRadius: '16px',
        cursor: 'pointer',
        fontSize: '1.1rem',
        fontWeight: isActive ? '600' : '500',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        letterSpacing: '0.5px',
        textAlign: 'center',
        width: '100%',
        animation: `fadeInMobile 0.5s ease-out ${delay}s both`,
        transform: (isHovered || isFocused) ? 'translateX(8px) scale(1.02)' : 'translateX(0) scale(1)',
        boxShadow: isActive 
          ? '0 8px 25px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
          : (isHovered || isFocused)
            ? '0 6px 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
            : '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
      aria-pressed={isActive}
      role="button"
    >
      <span style={{
        position: 'relative',
        zIndex: 2,
        display: 'block'
      }}>
        {children}
      </span>
      
      {/* Animated ripple effect */}
      <span style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: isHovered ? '100%' : '0%',
        height: isHovered ? '100%' : '0%',
        background: 'radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        transition: 'all 0.4s ease',
        borderRadius: '50%',
        zIndex: 1
      }} />
    </button>
  );
}

export default Navbar;
