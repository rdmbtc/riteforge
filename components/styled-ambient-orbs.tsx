"use client"

import styled, { keyframes } from 'styled-components'

const float = keyframes`
  0%, 100% { transform: translateY(0px) translateX(0px); }
  25% { transform: translateY(-20px) translateX(10px); }
  50% { transform: translateY(-10px) translateX(-10px); }
  75% { transform: translateY(-30px) translateX(5px); }
`

const float2 = keyframes`
  0%, 100% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(15px) translateX(-15px); }
  66% { transform: translateY(-25px) translateX(20px); }
`

const pulse = keyframes`
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.25; transform: scale(1.05); }
`

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

export const AmbientOrbs = () => {
  return (
    <StyledWrapper>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="grid-overlay" />
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: ${float} 20s ease-in-out infinite;
  }

  .orb-1 {
    width: 600px;
    height: 600px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
    top: -200px;
    left: -100px;
    animation-duration: 25s;
    animation-delay: 0s;
  }

  .orb-2 {
    width: 500px;
    height: 500px;
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #67e8f9 100%);
    bottom: -150px;
    right: -100px;
    animation: ${float2} 30s ease-in-out infinite;
    animation-delay: -5s;
  }

  .orb-3 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #f9a8d4 100%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: ${pulse} 15s ease-in-out infinite;
    opacity: 0.1;
  }

  .orb-4 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
    top: 30%;
    right: 10%;
    animation: ${float2} 22s ease-in-out infinite;
    animation-delay: -10s;
    opacity: 0.15;
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: ${shimmer} 10s linear infinite;
    background-position: 0 0;
  }

  @media (max-width: 768px) {
    .orb {
      filter: blur(60px);
    }
    .orb-1 {
      width: 300px;
      height: 300px;
    }
    .orb-2 {
      width: 250px;
      height: 250px;
    }
    .orb-3 {
      width: 200px;
      height: 200px;
    }
    .orb-4 {
      width: 150px;
      height: 150px;
    }
  }
`