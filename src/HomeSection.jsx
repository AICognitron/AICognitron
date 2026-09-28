import React, { useState, useEffect } from 'react';
import Hyperspeed from './Hyperspeed';
import './HomeSection.css';
import './ThinkX.css';

function HomeSection({ onNavigate }) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [hyperspeedError, setHyperspeedError] = useState(false);

  useEffect(() => {
    // Check for WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  // Hackathon 2026 register button (original Google Form)
  const handleHackathonRegisterClick = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSfGGYOBOUBDjy-eqMmbfWZQExQpw95HVYZSYdyGDVNEZT4wUA/viewform?usp=dialog', '_blank');
  };

  // Think-X register button: open the Think-X registration tab
  const handleRegisterClick = () => {
    if (onNavigate) onNavigate('thinkx', 'register');
    else window.location.hash = 'thinkx';
  };

  return (
    <>
      <section id="home" className="home-section">
        {/* Hyperspeed Animation - with error handling */}
        {webglSupported && !hyperspeedError ? (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            opacity: 0.8,
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {(() => {
                try {
                  return (
                    <Hyperspeed
                      effectOptions={{
                        onSpeedUp: () => { },
                        onSlowDown: () => { },
                        distortion: 'turbulentDistortion',
                        length: 400,
                        roadWidth: 10,
                        islandWidth: 2,
                        lanesPerRoad: 4,
                        fov: 90,
                        fovSpeedUp: 150,
                        speedUp: 2,
                        carLightsFade: 0.4,
                        totalSideLightSticks: 20,
                        lightPairsPerRoadWay: 40,
                        shoulderLinesWidthPercentage: 0.05,
                        brokenLinesWidthPercentage: 0.1,
                        brokenLinesLengthPercentage: 0.5,
                        lightStickWidth: [0.12, 0.5],
                        lightStickHeight: [1.3, 1.7],
                        movingAwaySpeed: [60, 80],
                        movingCloserSpeed: [-120, -160],
                        carLightsLength: [400 * 0.03, 400 * 0.2],
                        carLightsRadius: [0.05, 0.14],
                        carWidthPercentage: [0.3, 0.5],
                        carShiftX: [-0.8, 0.8],
                        carFloorSeparation: [0, 5],
                        colors: {
                          roadColor: 0x080808,
                          islandColor: 0x0a0a0a,
                          background: 0x000000,
                          shoulderLines: 0xFFFFFF,
                          brokenLines: 0xFFFFFF,
                          leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
                          rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
                          sticks: 0x03B3C3,
                        }
                      }}
                    />
                  );
                } catch (error) {
                  console.warn('Hyperspeed component failed to render:', error);
                  setHyperspeedError(true);
                  return null;
                }
              })()}
            </div>
          </div>
        ) : (
          // Fallback background when WebGL is not supported
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)',
            opacity: 0.8,
            pointerEvents: 'none',
          }} />
        )}
        
        {/* Logos Section */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '0',
          right: '0',
          zIndex: 2,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          {/* Left Logo - BIS */}
          <img 
            src="/assets/BIS_LOGO.png" 
            alt="BIS Logo" 
            style={{
              width: 'clamp(50px, 8vw, 80px)',
              height: 'auto',
              opacity: 0.9,
              flexShrink: 0,
            }}
          />
          
          {/* Center Logo - SRM */}
          <img 
            src="/assets/srm.png" 
            alt="SRM Logo" 
            style={{
              backgroundColor: 'white',
              width: 'clamp(400px, 40vw, 400px)',
              padding: 'clamp(5px, 1vw, 10px)',
              borderRadius: '10px',
              height: 'auto',
              opacity: 1,
              flexShrink: 1,
              maxWidth: '60%',
            }}
          />
          
          {/* Right Logo - SRMVEC */}
          <img 
            src="/assets/srmvec.png" 
            alt="SRMVEC Logo" 
            style={{
              width: 'clamp(50px, 8vw, 80px)',
              height: 'auto',
              opacity: 0.9,
              flexShrink: 0,
            }}
          />
        </div>

        <div className="home-content">
          <h1 className="home-title">Where Code meets Quality</h1>
          <p className="home-desc">
            Your journey into the future of <span style={{color:'#f7c873'}}>AI</span> starts here.
          </p>
        </div>
      </section>

      <section>
        <div className="hod-message">
          <h2 className="hod-title">Message from the HOD</h2>
          <p className="hod-text">
            Welcome to the AI Cognitron Club! We are committed to fostering innovation, collaboration, and excellence in the field of Artificial Intelligence and Data Science. Join us as we explore the frontiers of technology together.
          </p>
        </div>
      </section>

      {/* Think-X Event Card (replaces the old Hackathon 2026 card) */}
      <section style={{ 
        padding: '60px 20px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="tx-home-card" style={{
          background: 'linear-gradient(145deg, #1e1e2e 0%, #252540 100%)',
          borderRadius: '25px',
          padding: '40px',
          maxWidth: '1200px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1)',
          border: '1px solid rgba(247, 200, 115, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #f7c873, #03B3C3, #D856BF)',
            borderRadius: '25px 25px 0 0'
          }} />
          
          <div className="tx-home-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '50px',
            alignItems: 'start'
          }}>
            {/* Content Section */}
            <div style={{ minWidth: '0' }}>
              {/* Header */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(45deg, #f7c873, #ffdb4d)',
                  color: '#000',
                  padding: '8px 20px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Registrations Open · 4 Weeks
                </div>
                
                <h2 style={{
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  background: 'linear-gradient(45deg, #03B3C3, #D856BF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '20px',
                  fontWeight: 'bold',
                  lineHeight: '1.2'
                }}>
                  THINK-X – Campus Edition
                </h2>

                <p style={{ 
                  color: '#e0e0e0', 
                  fontSize: '16px',
                  lineHeight: '1.6',
                  marginBottom: '30px',
                  opacity: 0.9
                }}>
                  Observe. Think. Solve. Defend. Win. A 4-week campus innovation challenge by AI Cognitron Club: spot real problems on our campus, design practical AI/tech solutions, defend your idea and become the Campus Innovation Champion.
                </p>
              </div>

              {/* Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '30px',
                marginBottom: '40px'
              }}>
                {/* Key Details */}
                <div style={{
                  background: 'rgba(3, 179, 195, 0.1)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid rgba(3, 179, 195, 0.3)'
                }}>
                  <h3 style={{ 
                    color: '#03B3C3', 
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '24px' }}>📋</span>
                    Key Details
                  </h3>
                  <ul style={{ 
                    color: '#e0e0e0', 
                    listStyle: 'none',
                    padding: 0,
                    lineHeight: '2'
                  }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>👥</span>
                      Teams of 1–4 members
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>🎯</span>
                      4 weeks · 4 real problems
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>💡</span>
                      Spot-X → Solve-X → Data-X → Campus-X
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>⚡</span>
                      A new twist every week
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>✅</span>
                      Finalists defend their idea
                    </li>
                  </ul>
                </div>

                {/* Prizes */}
                <div style={{
                  background: 'rgba(247, 200, 115, 0.1)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid rgba(247, 200, 115, 0.3)'
                }}>
                  <h3 style={{ 
                    color: '#f7c873', 
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '24px' }}>🏆</span>
                    Prizes
                  </h3>
                  <ul style={{ 
                    color: '#e0e0e0', 
                    listStyle: 'none',
                    padding: 0,
                    lineHeight: '2'
                  }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ color: '#f7c873', fontSize: '20px' }}>🏆</span>
                      <strong>Weekly Winners: ₹500 – ₹2,000</strong>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ color: '#f7c873', fontSize: '20px' }}>🥈</span>
                      <strong>Top 3 Overall: Certificates + Special Prizes</strong>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#f7c873', fontSize: '20px' }}>⭐</span>
                      <strong>Campus Champion: ₹5,000 + Certificate</strong>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Register Button */}
              <button 
                className="button"
                onClick={handleRegisterClick}
                style={{
                  background: 'linear-gradient(45deg, #f7c873, #03B3C3)',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '15px 40px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#000',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: '0 8px 20px rgba(247, 200, 115, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 30px rgba(247, 200, 115, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 20px rgba(247, 200, 115, 0.4)';
                }}
              >
                Register Now!
              </button>
            </div>
            
            {/* Poster Section */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}>
              <div style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                border: '2px solid rgba(247, 200, 115, 0.3)',
                background: 'linear-gradient(145deg, #2a2a3e, #3a3a4e)',
                padding: '10px'
              }}>
                <img 
                  src="/assets/thinkx.jpg" 
                  alt="Think-X Campus Edition Poster" 
                  style={{
                    width: '320px',
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '15px',
                    display: 'block'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 30%, rgba(247, 200, 115, 0.1) 50%, transparent 70%)',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hackathon 2026 Event Card (original, kept) */}
      <section style={{ 
        padding: '60px 20px',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="tx-home-card" style={{
          background: 'linear-gradient(145deg, #1e1e2e 0%, #252540 100%)',
          borderRadius: '25px',
          padding: '40px',
          maxWidth: '1200px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1)',
          border: '1px solid rgba(247, 200, 115, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #f7c873, #03B3C3, #D856BF)',
            borderRadius: '25px 25px 0 0'
          }} />
          
          <div className="tx-home-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '50px',
            alignItems: 'start'
          }}>
            {/* Content Section */}
            <div style={{ minWidth: '0' }}>
              {/* Header */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(45deg, #f7c873, #ffdb4d)',
                  color: '#000',
                  padding: '8px 20px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Date: 04/02/2026 
                </div>
                
                <h2 style={{
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  background: 'linear-gradient(45deg, #03B3C3, #D856BF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '20px',
                  fontWeight: 'bold',
                  lineHeight: '1.2'
                }}>
                  Hackathon 2026 – AI Cognitron Club
                </h2>

                <p style={{ 
                  color: '#e0e0e0', 
                  fontSize: '16px',
                  lineHeight: '1.6',
                  marginBottom: '30px',
                  opacity: 0.9
                }}>
                  An 8-hour coding challenge that pushes your creativity and innovation. Showcase your technical skills and adapt to real-time changes in this ultimate hackathon experience.
                </p>
              </div>

              {/* Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '30px',
                marginBottom: '40px'
              }}>
                {/* Key Details */}
                <div style={{
                  background: 'rgba(3, 179, 195, 0.1)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid rgba(3, 179, 195, 0.3)'
                }}>
                  <h3 style={{ 
                    color: '#03B3C3', 
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '24px' }}>📋</span>
                    Key Details
                  </h3>
                  <ul style={{ 
                    color: '#e0e0e0', 
                    listStyle: 'none',
                    padding: 0,
                    lineHeight: '2'
                  }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>👥</span>
                      Teams of 3 members each
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>🎯</span>
                      Limited to 25 teams
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>💡</span>
                      SIH problem statements
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>⚡</span>
                      Real-time adaptations
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#03B3C3', fontSize: '16px' }}>✅</span>
                      BIS quality standards
                    </li>
                  </ul>
                </div>

                {/* Prizes */}
                <div style={{
                  background: 'rgba(247, 200, 115, 0.1)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid rgba(247, 200, 115, 0.3)'
                }}>
                  <h3 style={{ 
                    color: '#f7c873', 
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '24px' }}>🏆</span>
                    Prizes
                  </h3>
                  <ul style={{ 
                    color: '#e0e0e0', 
                    listStyle: 'none',
                    padding: 0,
                    lineHeight: '2'
                  }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ color: '#f7c873', fontSize: '20px' }}>🥇</span>
                      <strong>1st Prize: ₹10,000</strong>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ color: '#f7c873', fontSize: '20px' }}>🥈</span>
                      <strong>2nd Prize: ₹5,000</strong>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#f7c873', fontSize: '20px' }}>🥉</span>
                      <strong>3rd Prize: ₹3,000</strong>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Register Button */}
              <button 
                className="button"
                onClick={handleHackathonRegisterClick}
                style={{
                  background: 'linear-gradient(45deg, #f7c873, #03B3C3)',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '15px 40px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#000',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: '0 8px 20px rgba(247, 200, 115, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 30px rgba(247, 200, 115, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 8px 20px rgba(247, 200, 115, 0.4)';
                }}
              >
                Register Now!
              </button>
            </div>
            
            {/* Poster Section */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}>
              <div style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                border: '2px solid rgba(247, 200, 115, 0.3)',
                background: 'linear-gradient(145deg, #2a2a3e, #3a3a4e)',
                padding: '10px'
              }}>
                <img 
                  src="/assets/hack25.jpg" 
                  alt="Hackathon 2025 Poster" 
                  style={{
                    width: '320px',
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '15px',
                    display: 'block'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 30%, rgba(247, 200, 115, 0.1) 50%, transparent 70%)',
                  pointerEvents: 'none'
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

export default HomeSection;
