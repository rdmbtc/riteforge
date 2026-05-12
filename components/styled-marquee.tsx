"use client"

import styled from 'styled-components'

export const Marquee = () => {
  return (
    <StyledWrapper>
      <div className="marquee">
        <div className="marquee_header">Build with RiteForge</div>
        <div className="marquee__inner">
          <div className="marquee__group">
            <span>ERC-20 Tokens</span>
            <span>NFT Collections</span>
            <span>Staking Contracts</span>
            <span>DAO Governance</span>
            <span>DeFi Protocols</span>
          </div>
          <div className="marquee__group">
            <span>ERC-20 Tokens</span>
            <span>NFT Collections</span>
            <span>Staking Contracts</span>
            <span>DAO Governance</span>
            <span>DeFi Protocols</span>
          </div>
        </div>
      </div>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  .marquee {
    overflow: hidden;
    width: 100%;
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0%,
      black 10%,
      black 90%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to right,
      transparent 0%,
      black 10%,
      black 90%,
      transparent 100%
    );
  }
  .marquee_header {
    font-size: 35px;
    font-weight: 800;
    text-align: center;
    margin-bottom: 20px;
  }
  .marquee__inner {
    display: flex;
    width: max-content;
    animation: marquee 15s linear infinite;
  }

  .marquee__group {
    display: flex;
  }

  .marquee__group span {
    margin: 0 1.5rem;
    white-space: nowrap;
    background: #000000;
    color: white;
    padding: 4px 16px 4px 12px;
    border-radius: 6px;
    font-size: 1.2rem;
  }

  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
`