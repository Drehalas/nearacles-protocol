# Nearacles Protocol

**The "Uber for Fact-Checking" - NEAR Intent-Based Oracle Protocol**

---

## 🌟 Overview

**What is Nearacles?** Think of it as "Uber for fact-checking" - users post questions with NEAR token rewards, and AI-powered oracle solvers compete to provide the most accurate, well-sourced answers. 

**Why use it?** Unlike traditional oracles that give you pre-programmed data feeds, Nearacles lets you ask *any question* and get research-backed answers with economic guarantees. Perfect for DeFi, governance, news verification, or any application needing reliable real-world information.

### 🆚 Traditional Oracles vs. Nearacles

| Traditional Oracles | Nearacles Protocol |
|-------------------|-------------------|
| ❌ Fixed data feeds only | ✅ Ask any question |
| ❌ Single point of failure | ✅ Competitive solver network |
| ❌ No source attribution | ✅ Full source verification |
| ❌ No dispute mechanism | ✅ Economic challenge system |
| ❌ High setup costs | ✅ Pay-per-use model |

### 📋 How It Works (Simple Flow)

```
1. User creates intent: "Is renewable energy adoption accelerating?"
   └─ Stakes 1 NEAR (~$2-5) as reward

2. Oracle solvers compete with quotes:
   ├─ Solver A: "90% confidence, 3 min, stake 0.5 NEAR"
   ├─ Solver B: "95% confidence, 2 min, stake 1 NEAR"  
   └─ Best solver selected automatically

3. Winner conducts AI research:
   ├─ Searches 10+ sources
   ├─ Validates source reliability  
   └─ Returns answer + evidence

4. Challenge period (24-48 hours):
   ├─ Anyone can dispute with counter-evidence
   ├─ Must stake MORE than original solver
   └─ Economic voting resolves disputes

5. Rewards distributed:
   └─ Accurate answers earn rewards + reputation
```

---

## 🌟 Revolutionary Features

- **🎯 Intent-Driven Architecture**: Users express information needs as intents instead of direct API calls
- **💰 Economic Truth Marketplace**: Competitive solvers provide economically guaranteed answers with staking/slashing
- **⚔️ Adversarial Validation**: Counter-evidence challenges create self-correcting truth discovery
- **🔗 Cross-Chain Oracle**: NEAR intent infrastructure enables multi-chain fact-checking
- **🤖 AI-Powered Research**: Real-time web search with source validation and reliability scoring

## 🏗️ Architecture

### Core Oracle System
```typescript
import { OracleService } from 'nearacles-protocol';

const oracle = new OracleService(process.env.OPENAI_API_KEY);

// Traditional oracle usage
const evaluation = await oracle.evaluate("Is Bitcoin trading above $50,000?");
const refutation = await oracle.refute(evaluation);
```

### Intent-Based Oracle System
```typescript
import { IntentBroadcaster, SolverNode } from 'nearacles-protocol';

// User creates intent
const broadcaster = new IntentBroadcaster(privateKey);
const intent = broadcaster.createCredibilityEvaluationIntent(
  'user.near',
  'Is Bitcoin trading above $50,000?',
  { reward: '2000000000000000000000000' } // 2 NEAR
);

// Solver nodes compete to fulfill intent
const solver = new SolverNode(nearConfig, openaiKey);
await solver.start(); // Automatically bids and executes intents
```

## ⚡ Quick Start (5-Minute Test)

Get Nearacles running and test your first intent in under 5 minutes!

### Step 1: Install & Setup (2 minutes)
```bash
# Install the package
npm install nearacles-protocol

# Set your API keys
export OPENAI_API_KEY="sk-..." # Get from OpenAI dashboard
export NEAR_PRIVATE_KEY="ed25519:..." # Get from NEAR CLI
```

**Cost estimate**: Free setup, ~$0.50 per basic evaluation

### Step 2: Test Basic Oracle (2 minutes)
```typescript
import { OracleService } from 'nearacles-protocol';

const oracle = new OracleService(process.env.OPENAI_API_KEY);

// Ask any question - get researched answer with sources
const result = await oracle.evaluate("Is Bitcoin trading above $50,000?");

console.log(result);
// Expected output:
// {
//   question: "Is Bitcoin trading above $50,000?",
//   answer: true,
//   confidence: 0.95,
//   sources: [
//     { title: "CoinMarketCap", url: "...", reliability: 0.9 },
//     { title: "CoinGecko", url: "...", reliability: 0.85 }
//   ],
//   executionTime: 3200
// }
```

### Step 3: Try Intent-Based Oracle (1 minute)
```typescript
import { IntentBroadcaster } from 'nearacles-protocol';

const broadcaster = new IntentBroadcaster(process.env.NEAR_PRIVATE_KEY);

// Create intent with economic guarantees
const result = await broadcaster.executeOracleIntent(
  'your-account.testnet',
  {
    intent: 'credibility_evaluation',
    question: 'Are electric vehicle sales growing faster than gas cars?',
    required_sources: 5,
    confidence_threshold: 0.85,
    reward: '1000000000000000000000000' // 1 NEAR (~$2-5)
  }
);

console.log('Intent executed with economic guarantees:', result);
```

**🎉 Success!** You just created your first economically-guaranteed oracle query. The system will find competitive solvers, execute research, and provide verifiable answers.

**Troubleshooting:**
- **Error: Invalid API key**: Check your OpenAI API key format starts with `sk-`
- **Error: NEAR account**: Ensure you have testnet NEAR tokens from [faucet](https://near-faucet.io/)
- **Slow responses**: First queries may take 30-60 seconds as solvers initialize

## 🎮 Demo

Run the interactive demo to see the complete intent-based oracle flow:

```bash
npm run demo
```

## 🏛️ Smart Contract Deployment

Deploy the NEAR smart contract for oracle intent settlement:

```bash
# Install cargo-near
cargo install cargo-near

# Build contract
cd contracts/oracle-intent
cargo near build

# Deploy to testnet
cargo near deploy build-non-reproducible-wasm your-contract.testnet with-init-call new json-args '{"owner": "your-account.testnet"}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-keychain send
```

## 💡 Intent Types

### Credibility Evaluation
```typescript
{
  intent: 'credibility_evaluation',
  question: 'Is the Earth round?',
  required_sources: 3,
  confidence_threshold: 0.9,
  reward: '1000000000000000000000000'
}
```

### Refutation Challenge  
```typescript
{
  intent: 'refutation_challenge',
  evaluation_hash: 'eval_123',
  challenge_stake: '2000000000000000000000000', // Must exceed original
  counter_evidence: [/* sources */]
}
```

### Oracle Settlement
```typescript
{
  intent: 'oracle_settlement',
  evaluation_hash: 'eval_123',
  challenge_hash: 'challenge_456',
  settlement_method: 'consensus'
}
```

## 🔧 Configuration

### Solver Node Configuration
```typescript
{
  minStakeAmount: '1000000000000000000000000', // 1 NEAR
  maxExecutionTime: 300, // 5 minutes
  confidenceThreshold: 0.8,
  reputationThreshold: 0.7
}
```

### Bidding Strategies
```typescript
{
  name: 'competitive',
  confidenceMultiplier: 1.0,
  stakeMultiplier: 1.0,
  executionTimeBuffer: 30,
  profitMargin: 0.1
}
```

## 🎯 Economic Model

### Incentive Structure
- **Intent Creators**: Stake NEAR tokens for oracle services
- **Oracle Solvers**: Stake tokens to participate, earn rewards for accuracy
- **Challengers**: Stake higher amounts to dispute evaluations
- **Reputation System**: Performance affects future earning potential

### Economic Flow
1. User stakes NEAR for credibility evaluation
2. Solvers compete with quotes and stake requirements  
3. Best solver executes evaluation and submits result
4. Challenge period allows counter-evidence submissions
5. Disputes resolved through economic mechanisms
6. Rewards distributed based on accuracy verification

## 📊 Monitoring & Metrics

```typescript
const metrics = solver.getMetrics();
console.log({
  totalIntentsProcessed: metrics.totalIntentsProcessed,
  successfulEvaluations: metrics.successfulEvaluations,
  currentReputation: metrics.currentReputation,
  totalEarnings: metrics.totalEarnings,
  activeIntentsCount: metrics.activeIntentsCount
});
```

## 🔮 Use Cases

- **DeFi Price Oracles**: Decentralized price feeds with economic guarantees
- **News Verification**: Fact-checking with source attribution and challenges
- **Scientific Claims**: Peer-reviewed evaluation of research claims
- **Governance Decisions**: Evidence-based policy evaluation
- **Insurance Claims**: Automated claim verification with dispute resolution

## 🛣️ Roadmap

- [x] **Phase 1**: Core oracle extraction and TypeScript conversion
- [x] **Phase 2**: NEAR intent protocol integration
- [x] **Phase 3**: Economic mechanisms and smart contracts
- [x] **Phase 4**: Solver network and automated execution
- [ ] **Phase 5**: Production deployment and mainnet launch
- [ ] **Phase 6**: Cross-chain bridge integration
- [ ] **Phase 7**: Advanced AI model integration
- [ ] **Phase 8**: Decentralized governance implementation

## 🤝 Contributing

This protocol is in active development. Key areas for contribution:
- Oracle solver optimization algorithms
- Cross-chain intent relay mechanisms  
- Smart contract gas optimization
- Economic mechanism modeling
- Security audit and testing

## 📜 License

MIT License - see LICENSE file for details