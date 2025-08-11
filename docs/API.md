# NEAR Intent Protocol API Documentation

## Intent Agent API

### Creating Intents
```typescript
const result = await intentAgent.createIntent({
  asset_in: 'NEAR',
  asset_out: 'USDC', 
  amount_in: '10000000000000000000000000', // 10 NEAR
  slippage_tolerance: 0.01 // 1%
});
```

### AI-Powered Smart Intents
```typescript
const result = await intentAgent.createSmartIntent(
  'swap 10 NEAR for USDC with low risk',
  { riskTolerance: 'low' }
);
```

## AI Agent API

### Market Analysis
```typescript
const analysis = await aiAgent.makeDecision(intent, quotes, context);
```

### Risk Assessment
```typescript
const riskAssessment = await riskAssessor.assessRisk(intent, quotes);
```

## Asset Manager API

### Get Balances
```typescript
const balances = await assetManager.getAllBalances();
```

### Format Amounts
```typescript
const formatted = assetManager.formatAmount('NEAR', amount);
```
