# Nearacles Oracle Node - Deployment Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Target**: TEE-secured Price Oracle on NEAR Testnet

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [TEE Deployment (Phala Dstack)](#tee-deployment-phala-dstack)
5. [Environment Configuration](#environment-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v20.x or higher
- **npm**: v9.x or higher
- **Docker**: v24.x or higher (for containerized deployment)
- **Rust**: v1.81.0 (for smart contract compilation)
- **NEAR CLI**: Latest version

### Required Accounts

- **NEAR Testnet Account**: For oracle node registration
- **OpenAI API Key**: For credibility evaluations
- **Phala Cloud Account** (for TEE deployment): Free tier available
- **Dstack API Key** (for TEE deployment): Obtained from Phala Cloud

### Required Stake

- Minimum 1 NEAR token for solver registration

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/nearacles/nearacles-protocol.git
cd nearacles-protocol
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Minimum Required Configuration**:

```env
NEAR_NETWORK=testnet
NEAR_NODE_URL=https://rpc.testnet.near.org
NEAR_CONTRACT_ID=oracle-v3.nearacles.testnet
NEAR_ACCOUNT_ID=your-node.testnet
NEAR_PRIVATE_KEY=ed25519:YOUR_KEY
OPENAI_API_KEY=sk-YOUR_KEY
TEE_MODE=disabled
```

### 4. Run Development Server

```bash
npm run start-backend
```

Expected output:
```
Starting Oracle Solver Node...
NEAR connection initialized
Registered as oracle solver (non-TEE mode)
Price oracle pusher started
Monitoring for oracle intents...
```

---

## Docker Deployment

### 1. Build Docker Image

```bash
docker build -t nearacles-oracle:latest .
```

### 2. Run Container

```bash
docker run -d \
  --name nearacles-oracle \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  nearacles-oracle:latest
```

### 3. View Logs

```bash
docker logs -f nearacles-oracle
```

### 4. Stop Container

```bash
docker stop nearacles-oracle
docker rm nearacles-oracle
```

---

## TEE Deployment (Phala Dstack)

### Overview

TEE (Trusted Execution Environment) deployment provides cryptographic proof that your oracle node is running unmodified code in a secure environment.

### Prerequisites

1. **Phala Cloud Account**: https://cloud.phala.network
2. **Dstack API Key**: Obtained from Phala Cloud dashboard
3. **Docker Hub Account**: For publishing Docker images

### Step 1: Prepare TEE Configuration

Update `.env` for TEE mode:

```env
TEE_MODE=enabled
TEE_ENV=production
TEE_PROVIDER=dstack
DSTACK_API_KEY=your_dstack_api_key
DSTACK_DEPLOYMENT_ID=your_deployment_id
DSTACK_DEPLOYMENT_URL=https://your-deployment.dstack.host
```

### Step 2: Build and Push Docker Image

```bash
# Tag image for Docker Hub
docker tag nearacles-oracle:latest yourusername/nearacles-oracle:latest

# Push to Docker Hub
docker push yourusername/nearacles-oracle:latest
```

### Step 3: Deploy to Dstack

**Option A: Using Dstack CLI**

```bash
# Install Dstack CLI
npm install -g @phala/dstack-cli

# Login to Dstack
dstack login

# Deploy container
dstack deploy \
  --image yourusername/nearacles-oracle:latest \
  --name nearacles-oracle-node \
  --env-file .env
```

**Option B: Using Phala Cloud Dashboard**

1. Go to https://cloud.phala.network
2. Navigate to "Deploy" section
3. Select "Deploy from Docker Image"
4. Enter image: `yourusername/nearacles-oracle:latest`
5. Configure environment variables from `.env`
6. Click "Deploy"

### Step 4: Retrieve Deployment Information

After deployment, note:
- **Deployment ID**: Used for attestation
- **Deployment URL**: Your node's TEE endpoint (e.g., `https://0xABCD.dstack.host`)

Update `.env` with these values and redeploy.

### Step 5: Verify TEE Attestation

```bash
# Query TEE status from contract
near view oracle-v3.nearacles.testnet get_tee_status \
  '{"solver_id": "your-node.testnet"}'
```

Expected response:
```json
{
  "tee_verified": true,
  "last_attestation_update": 1699000000000,
  "tee_provider": "dstack",
  "deployment_url": "https://0xABCD.dstack.host"
}
```

---

## Environment Configuration

### Complete Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEAR_NETWORK` | Yes | - | Network ID (`testnet` or `mainnet`) |
| `NEAR_NODE_URL` | Yes | - | NEAR RPC endpoint |
| `NEAR_CONTRACT_ID` | Yes | - | Oracle contract address |
| `NEAR_ACCOUNT_ID` | Yes | - | Your oracle node account |
| `NEAR_PRIVATE_KEY` | Yes | - | Node private key (ed25519:...) |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `TEE_MODE` | No | `disabled` | Enable TEE mode (`enabled`/`disabled`) |
| `TEE_ENV` | No | `development` | TEE environment (`production`/`development`) |
| `TEE_PROVIDER` | No | `dstack` | TEE provider (`dstack`/`phala`) |
| `DSTACK_API_KEY` | TEE only | - | Dstack API key |
| `DSTACK_DEPLOYMENT_ID` | TEE only | - | Deployment ID from Dstack |
| `DSTACK_DEPLOYMENT_URL` | TEE only | - | Deployment URL |
| `MIN_STAKE_AMOUNT` | No | `1000000000000000000000000` | Minimum stake (1 NEAR) |
| `PRICE_UPDATE_INTERVAL` | No | `60000` | Price push interval (ms) |
| `MIN_PRICE_SOURCES` | No | `5` | Minimum API sources |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `production` | Node environment |

### Configuration Modes

**Development Mode** (without TEE):
```env
TEE_MODE=disabled
TEE_ENV=development
```

**Production Mode** (with TEE):
```env
TEE_MODE=enabled
TEE_ENV=production
TEE_PROVIDER=dstack
DSTACK_API_KEY=your_key
DSTACK_DEPLOYMENT_ID=your_id
DSTACK_DEPLOYMENT_URL=https://your-deployment.dstack.host
```

---

## Monitoring & Maintenance

### Health Check

```bash
curl http://localhost:3000/health
```

### Check Node Status

```bash
# View solver info
near view oracle-v3.nearacles.testnet get_solver \
  '{"solver_id": "your-node.testnet"}'

# Check TEE verification status
near view oracle-v3.nearacles.testnet is_tee_verified \
  '{"solver_id": "your-node.testnet"}'

# Get current price data
near view oracle-v3.nearacles.testnet get_price \
  '{"asset_id": "BTC_USD"}'
```

### View Logs

**Docker**:
```bash
docker logs -f nearacles-oracle
```

**Local**:
```bash
# Logs are written to stdout
npm run start-backend
```

### Monitoring Metrics

Key metrics to monitor:
- **Price Push Success Rate**: Should be >95%
- **Attestation Freshness**: Updated every 1 hour
- **API Source Availability**: Minimum 5 sources responding
- **Response Time**: <5 seconds per price update

### Automatic Attestation Refresh

TEE attestations are automatically refreshed every 1 hour. No manual intervention required.

### Manual Attestation Refresh

If needed, restart the node:

```bash
# Docker
docker restart nearacles-oracle

# Local
npm run start-backend
```

---

## Troubleshooting

### Common Issues

#### 1. "Not a registered solver" Error

**Cause**: Node account not registered in contract

**Solution**:
```bash
# Register manually
near call oracle-v3.nearacles.testnet register_solver \
  --accountId your-node.testnet \
  --deposit 1
```

#### 2. "Insufficient stake" Error

**Cause**: Not enough NEAR deposited

**Solution**: Ensure minimum 1 NEAR is deposited during registration

#### 3. TEE Attestation Verification Failed

**Cause**: Invalid attestation or expired timestamp

**Solutions**:
- Check `DSTACK_DEPLOYMENT_ID` matches actual deployment
- Verify `DSTACK_API_KEY` is valid
- Ensure system clock is synchronized
- Check attestation age (max 24 hours)

#### 4. Price Source Failures

**Cause**: API rate limits or network issues

**Solution**:
- System automatically retries failed sources
- Minimum 5 sources required (out of 10)
- Check network connectivity
- Review API keys if using authenticated endpoints

#### 5. Contract is Paused

**Cause**: Contract owner paused operations

**Solution**:
```bash
# Check pause status
near view oracle-v3.nearacles.testnet is_paused

# Only contract owner can unpause
near call oracle-v3.nearacles.testnet unpause \
  --accountId owner.testnet
```

### Debug Mode

Enable verbose logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Support

For additional support:
- GitHub Issues: https://github.com/nearacles/nearacles-protocol/issues
- Documentation: https://docs.nearacles.com
- Discord: https://discord.gg/nearacles

---

## Security Best Practices

1. **Private Key Management**
   - Never commit private keys to version control
   - Use environment variables or secure key management systems
   - Rotate keys periodically

2. **TEE Deployment**
   - Always verify attestation after deployment
   - Monitor attestation freshness
   - Use production mode for mainnet deployments

3. **Network Security**
   - Use HTTPS for all external communications
   - Implement rate limiting on API endpoints
   - Keep Docker images updated

4. **Monitoring**
   - Set up alerts for failed price pushes
   - Monitor attestation expiration
   - Track solver reputation score

---

## Next Steps

After successful deployment:

1. Monitor price push success rate
2. Verify TEE attestation status
3. Check solver reputation score
4. Set up monitoring dashboards
5. Configure backup nodes for redundancy

For production mainnet deployment, repeat these steps with mainnet configuration.

---

*Last Updated: 2025-11-03*
*Version: 1.0.0*
