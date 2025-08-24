# David Chen - DeFi Risk Manager

## Overview
**Age:** 36  
**Location:** Singapore  
**Role:** Head of Risk Management  
**Company:** Leading DeFi lending protocol (~$150M TVL, 80k+ active borrowers)  
**Experience:** 12 years risk management, former Aave and traditional banking  

## Demographics & Background
- Masters in Financial Engineering from NUS, CFA and FRM certifications
- Previously Head of Credit Risk at Aave, before that VP at JPMorgan
- Speaks English, Mandarin, and Cantonese, covers APAC risk operations
- Lives in Singapore's financial district, travels frequently across Asia
- Active in DeFi risk management working groups and regulatory discussions
- Expert in both traditional finance and DeFi risk modeling

## Primary Goals
- **Improve credit risk models** using identity verification and on-chain behavior
- **Reduce bad debt and liquidation losses** through better borrower assessment  
- **Implement anti-Sybil protection** for lending limits and incentive programs
- **Ensure regulatory compliance** for identity verification requirements
- **Optimize collateral requirements** based on borrower identity and history
- **Scale lending operations** while maintaining conservative risk profiles

## Key Frustrations
- **Sybil attacks** circumventing borrowing limits and risk controls
- **Anonymous borrowers** make traditional credit models ineffective
- **Liquidation cascades** during market volatility due to poor risk assessment
- **Regulatory pressure** for Know Your Customer without clear guidelines
- **Limited data sources** for assessing borrower creditworthiness
- **Technical complexity** of integrating identity verification with lending protocols

## Personality Traits
- **Risk-averse and analytical** - prioritizes safety over growth
- **Data-driven decision maker** - relies on statistical models and backtesting
- **Compliance-conscious** - navigates regulatory requirements carefully
- **Technical translator** - bridges risk concepts with engineering teams
- **Conservative innovator** - adopts new tech cautiously after thorough testing
- **Detail-oriented perfectionist** - small errors can mean millions in losses

## Needs & Expectations
- **Reliable identity verification** - 99.9%+ accuracy for credit decisions
- **Privacy-preserving compliance** - KYC without exposing user data on-chain
- **Real-time risk scoring** - instant identity-based creditworthiness assessment
- **Anti-Sybil guarantees** - provably unique users for lending limits
- **Audit trail compliance** - complete records for regulatory examination
- **Integration flexibility** - works with existing risk management infrastructure

## Key Behaviors & Actions
- **Develops risk models** incorporating identity signals and on-chain behavior
- **Monitors lending metrics** daily for early warning signs
- **Conducts stress testing** of identity verification and credit models
- **Reviews regulatory guidance** and implements compliance procedures
- **Collaborates with engineering** on smart contract risk parameters
- **Reports to executives** on protocol health and risk exposure

## Technology Stack
- **Risk Tools:** Python/R for modeling, Jupyter notebooks, Monte Carlo simulations
- **Monitoring:** Custom dashboards, Grafana, PagerDuty for alerts
- **Data Sources:** On-chain data, identity oracles, traditional credit bureaus
- **Communication:** Slack, email, risk management forums
- **Compliance:** Document management systems, audit preparation tools

## How He Uses Nearacles

### Risk Model Development
- Integrates identity verification data into credit scoring algorithms
- Backtests lending decisions using historical identity and performance data
- Develops borrower segmentation based on identity verification levels
- Creates risk-based pricing models for different identity verification tiers

### Daily Operations
- Monitors identity verification success rates and failure patterns
- Reviews large loan applications requiring enhanced identity verification
- Tracks correlation between identity signals and loan performance
- Analyzes Sybil attack attempts and prevention effectiveness

### Compliance Management
- Documents identity verification procedures for regulatory audits
- Maintains borrower identity records for compliance requirements
- Reports identity verification statistics to regulatory bodies
- Ensures privacy compliance while meeting KYC obligations

### Strategic Analysis
- Uses Analytics to optimize identity verification requirements by risk tier
- Evaluates ROI of identity verification on bad debt reduction
- Benchmarks identity verification performance against industry standards
- Provides recommendations on identity verification policy changes

## Representative Quote
> "Identity verification is critical for our lending risk models and DAO governance. We need to know our borrowers are real people without compromising their privacy - it's the key to scaling DeFi lending responsibly."

## Pain Points with Current Solutions
- **Traditional KYC:** Too invasive and slow for DeFi users
- **No verification:** High Sybil attack risk and regulatory exposure
- **Manual processes:** Don't scale with protocol growth
- **Privacy concerns:** Users resist full identity disclosure

## Success Metrics
- **Bad debt ratio:** <2% of total loans outstanding
- **Sybil attack prevention:** 99%+ detection rate for multi-account abuse
- **Identity verification completion:** 85%+ of borrowers successfully verified
- **Regulatory compliance:** Zero violations in identity verification procedures
- **Risk-adjusted returns:** 15%+ annual yield after accounting for defaults

## Risk Management Framework

### Identity-Based Risk Tiers
- **Tier 1:** Fully verified - highest borrowing limits, lowest rates
- **Tier 2:** Partial verification - medium limits and rates
- **Tier 3:** Anonymous - lowest limits, highest rates

### Credit Scoring Integration
- **On-chain behavior:** Transaction history, DeFi protocol usage
- **Identity signals:** Verification level, social attestations
- **Market factors:** Collateral volatility, liquidity conditions
- **Temporal factors:** Account age, borrowing history

## Regulatory Considerations
- **APAC compliance:** MAS guidelines, China restrictions, Japan regulations
- **Privacy laws:** GDPR compliance, data minimization principles
- **Financial regulations:** Anti-money laundering, sanctions screening
- **Cross-border rules:** Data localization, reporting requirements

## Decision-Making Process
1. **Risk assessment** (identity verification impact on credit models)
2. **Regulatory review** (compliance with local and international laws)
3. **Technical evaluation** (integration complexity, system reliability)
4. **Backtesting validation** (historical performance analysis)
5. **Pilot program** (limited rollout with monitoring)
6. **Full deployment** (gradual scaling with risk monitoring)

## Customer Examples
- **Burrow:** NEAR-native lending with identity-enhanced credit models
- **Aave:** Leading DeFi lender implementing identity verification
- **Compound:** Established lending protocol exploring identity integration
- **Euler:** Advanced lending protocol with sophisticated risk management

## User Journey Maps

### Main Customer Journey

```mermaid
journey
    title David's Identity-Enhanced Risk Management Journey
    section Discovery
      High bad debt rates: 1: David
      Sybil attacks on lending limits: 1: David  
      Regulatory pressure for KYC: 2: David
      Research identity solutions: 4: David
    section Evaluation
      Analyze identity signal correlation: 4: David
      Backtest credit models: 5: David
      Assess regulatory compliance: 4: David
      Present ROI to executive team: 4: David
    section Implementation
      Integrate identity verification: 3: David
      Deploy risk-based tiers: 4: David
      Monitor bad debt reduction: 5: David
      Generate compliance reports: 4: David
    section Success & Expansion
      Achieve <2% bad debt target: 5: David
      Scale lending operations: 4: David
      Add advanced risk features: 5: David
```

### Decision Flow Diagram

```mermaid
flowchart TD
    A[High Bad Debt & Sybil Attacks] --> B{Risk Assessment}
    B --> C[Identity Verification Needed]
    B --> D[Better Collateral Models]
    B --> E[Stricter Lending Limits]
    
    C --> F[Evaluate Identity Solutions]
    F --> G{Solution Criteria}
    G --> H[99.9% Accuracy?]
    G --> I[Privacy Preserving?]
    G --> J[Regulatory Compliant?]
    G --> K[Anti-Sybil Guaranteed?]
    
    H --> L{All Criteria Met?}
    I --> L
    J --> L
    K --> L
    
    L -->|Yes| M[Backtest Integration]
    L -->|No| N[Continue Evaluation]
    
    M --> O[Historical Data Analysis]
    O --> P{Bad Debt Reduction >50%?}
    P -->|Yes| Q[Pilot Implementation]
    P -->|No| R[Adjust Risk Models]
    R --> O
    
    Q --> S[Monitor Performance]
    S --> T{Target Metrics Achieved?}
    T -->|Yes| U[Full Deployment]
    T -->|No| V[Optimize Parameters]
    V --> S
```

### Technical Integration Workflow

```mermaid
sequenceDiagram
    participant David as David (Risk Manager)
    participant Eng as Engineering Team
    participant Nearacles as Nearacles API
    participant Borrowers as DeFi Borrowers
    participant Regulators as Regulatory Bodies
    
    David->>Eng: Request identity verification for risk models
    Eng->>Nearacles: Review identity verification APIs
    Nearacles-->>Eng: Identity scoring documentation
    
    David->>David: Design risk-based tier system
    David-->>Eng: Provide risk model specifications
    
    Eng->>Nearacles: Implement identity verification
    Nearacles-->>Eng: Identity attestations & scores
    
    Eng->>Borrowers: Deploy to Tier 1 borrowers (pilot)
    Borrowers-->>Eng: Complete identity verification
    
    David->>David: Monitor loan performance vs identity scores
    David->>Eng: Adjust risk parameters based on data
    
    Eng->>Nearacles: Full deployment across all tiers
    David->>Regulators: Generate compliance reports
    David->>David: Track bad debt reduction metrics
```

---

*This persona represents ~25% of Nearacles' target customers - DeFi lending protocols that need identity verification for credit risk management and regulatory compliance. David-type users are critical for high-value, long-term contracts.*