"use client"

import styled from 'styled-components'

interface GenerateButtonProps {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}

export const GenerateButton = ({ onClick, disabled, loading }: GenerateButtonProps) => {
  return (
    <StyledWrapper>
      <button className="btn" onClick={onClick} disabled={disabled || loading}>
        <svg className="sparkle" height={24} width={24} fill="#FFFFFF" viewBox="0 0 24 24" data-name="Layer 1" id="Layer_1">
          {loading ? (
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z" />
          )}
        </svg>
        <span className="text">{loading ? "Generating..." : "Generate"}</span>
      </button>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  .btn {
    border: none;
    width: auto;
    min-width: 280px;
    height: 3.5em;
    padding: 0 3em;
    border-radius: 3em;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    background: #1C1A1C;
    cursor: pointer;
    transition: all 450ms ease-in-out;
    position: relative;
    overflow: hidden;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .sparkle {
    fill: #AAAAAA;
    transition: all 800ms ease;
    width: 20px;
    height: 20px;
  }

  .text {
    font-weight: 600;
    color: #AAAAAA;
    font-size: 14px;
    transition: color 450ms ease;
    position: relative;
    z-index: 1;
  }

  .btn:hover:not(:disabled) {
    background: linear-gradient(0deg, #A47CF3, #683FEA);
    box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.4),
    inset 0px -4px 0px 0px rgba(0, 0, 0, 0.2),
    0px 0px 0px 4px rgba(255, 255, 255, 0.2),
    0px 0px 180px 0px #9917FF;
    transform: translateY(-2px);
  }

  .btn:hover:not(:disabled) .text {
    color: white;
  }

  .btn:hover:not(:disabled) .sparkle {
    fill: white;
    transform: scale(1.2);
  }

  /* Shine animation */
  .btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.6s ease;
  }

  .btn:hover:not(:disabled)::before {
    left: 100%;
  }
`