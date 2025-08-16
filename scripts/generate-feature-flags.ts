#!/usr/bin/env node

/**
 * Feature Flags Generator for NEAR Oracle Intent Protocol
 * Generates environment variables and configuration files for feature flags
 */

import { FeatureFlagService, initializeFeatureFlags } from '../backend/utils/feature-flags';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const environment = process.argv[2] || 'testnet';
const outputFormat = process.argv[3] || 'env'; // 'env' or 'json'

// Initialize feature flags
const featureFlags = initializeFeatureFlags({
  environment,
  override_enabled: true,
});

console.log(`🏗️  Generating feature flags for environment: ${environment}`);

switch (outputFormat) {
  case 'env':
    generateEnvironmentFile();
    break;
  case 'json':
    generateJsonFile();
    break;
  case 'typescript':
    generateTypescriptFile();
    break;
  default:
    console.error('Unknown output format:', outputFormat);
    console.log('Available formats: env, json, typescript');
    process.exit(1);
}

function generateEnvironmentFile(): void {
  const envVars = featureFlags.getEnvironmentVariables();
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const filename = `frontend/.env.${environment}-features`;
  const filepath = resolve(__dirname, '..', filename);

  const content = `# Feature Flags for ${environment.toUpperCase()} Environment
# Generated on ${new Date().toISOString()}
# This file is auto-generated. Do not edit manually.

${envContent}
`;

  writeFileSync(filepath, content);
  console.log(`✅ Generated environment file: ${filename}`);
  console.log(`📁 Location: ${filepath}`);
}

function generateJsonFile(): void {
  const flags = featureFlags.getAllFlags();
  const flagsData = {
    environment,
    generated_at: new Date().toISOString(),
    flags: flags.reduce((acc, flag) => {
      acc[flag.key] = {
        name: flag.name,
        description: flag.description,
        enabled: flag.current_status,
        rollout_percentage: flag.rollout_percentage,
        dependencies: flag.dependencies,
        metadata: flag.metadata,
      };
      return acc;
    }, {} as Record<string, any>),
  };

  const filename = `config/feature-flags-${environment}.json`;
  const filepath = resolve(__dirname, '..', filename);

  writeFileSync(filepath, JSON.stringify(flagsData, null, 2));
  console.log(`✅ Generated JSON file: ${filename}`);
  console.log(`📁 Location: ${filepath}`);
}

function generateTypescriptFile(): void {
  const flags = featureFlags.getAllFlags();
  
  const typeDefinitions = flags.map(flag => 
    `  /** ${flag.description} */\n  ${flag.key}: boolean;`
  ).join('\n');

  const flagValues = flags.map(flag =>
    `  ${flag.key}: ${flag.current_status},`
  ).join('\n');

  const content = `/**
 * Feature Flags Type Definitions and Configuration
 * Generated on ${new Date().toISOString()}
 * Environment: ${environment.toUpperCase()}
 * 
 * This file is auto-generated. Do not edit manually.
 */

export interface FeatureFlags {
${typeDefinitions}
}

export const FEATURE_FLAGS: FeatureFlags = {
${flagValues}
};

export const FEATURE_FLAG_ENVIRONMENT = '${environment}';

// Helper functions
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[feature];
}

export function getEnabledFeatures(): (keyof FeatureFlags)[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => key as keyof FeatureFlags);
}
`;

  const filename = `src/types/feature-flags.generated.ts`;
  const filepath = resolve(__dirname, '..', filename);

  writeFileSync(filepath, content);
  console.log(`✅ Generated TypeScript file: ${filename}`);
  console.log(`📁 Location: ${filepath}`);
}

// Show summary
console.log('\n📊 Feature Flags Summary:');
console.log('========================');

const enabledFlags = featureFlags.getEnabledFlags();
const allFlags = featureFlags.getAllFlags();

console.log(`Environment: ${environment}`);
console.log(`Total flags: ${allFlags.length}`);
console.log(`Enabled flags: ${enabledFlags.length}`);
console.log(`Disabled flags: ${allFlags.length - enabledFlags.length}`);

console.log('\n🟢 Enabled Features:');
enabledFlags.forEach(key => {
  const flag = featureFlags.getFlag(key);
  if (flag) {
    console.log(`  • ${flag.name} (${key})`);
  }
});

const disabledFlags = allFlags.filter(f => !f.current_status);
if (disabledFlags.length > 0) {
  console.log('\n🔴 Disabled Features:');
  disabledFlags.forEach(flag => {
    console.log(`  • ${flag.name} (${flag.key})`);
  });
}

console.log('\n🔧 Usage:');
console.log(`  Generate for different environment: npx tsx scripts/generate-feature-flags.ts production`);
console.log(`  Generate JSON output: npx tsx scripts/generate-feature-flags.ts ${environment} json`);
console.log(`  Generate TypeScript: npx tsx scripts/generate-feature-flags.ts ${environment} typescript`);