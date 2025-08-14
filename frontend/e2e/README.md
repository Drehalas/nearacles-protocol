# E2E Testing Suite for Nearacles Frontend

This comprehensive end-to-end testing suite provides thorough coverage of the Nearacles frontend application using Playwright.

## Test Coverage

### 1. Main Page Tests (`main-page.spec.ts`)
- **Purpose**: Validates core application loading and basic functionality
- **Coverage**:
  - Page loading and title verification
  - Root element rendering
  - Meta tags validation
  - CSS loading verification
  - Console error monitoring
  - Responsive design testing

### 2. SwaggerUI Component Tests (`swagger-ui.spec.ts`)
- **Purpose**: Tests the core SwaggerUI integration
- **Coverage**:
  - SwaggerUI component rendering
  - API documentation loading
  - Interactive operations (expand/collapse)
  - Swagger styling verification
  - swagger.json loading
  - Error handling for swagger failures
  - Mobile responsiveness

### 3. Accessibility Tests (`accessibility.spec.ts`)
- **Purpose**: Ensures compliance with accessibility standards
- **Coverage**:
  - WCAG compliance validation using axe-core
  - Keyboard navigation testing
  - Screen reader compatibility
  - Focus management
  - Color contrast validation
  - ARIA attributes verification

### 4. Performance Tests (`performance.spec.ts`)
- **Purpose**: Monitors application performance metrics
- **Coverage**:
  - Page load time validation
  - Core Web Vitals (FCP, LCP, CLS)
  - Memory leak detection
  - Resource optimization checks
  - Rendering efficiency
  - Network performance

### 5. API Integration Tests (`api-integration.spec.ts`)
- **Purpose**: Tests API connectivity and error handling
- **Coverage**:
  - swagger.json endpoint testing
  - Network failure simulation
  - Slow response handling
  - Malformed response handling
  - CORS policy compliance
  - Concurrent request handling

### 6. Error Handling Tests (`error-handling.spec.ts`)
- **Purpose**: Validates graceful error handling across scenarios
- **Coverage**:
  - JavaScript error handling
  - Missing resource handling
  - Network connectivity issues
  - Browser resize/orientation changes
  - Rapid user interactions
  - Invalid URL handling
  - Browser navigation testing

### 7. Cross-Browser Compatibility (`cross-browser.spec.ts`)
- **Purpose**: Ensures functionality across different browsers and devices
- **Coverage**:
  - Chromium, Firefox, WebKit testing
  - Mobile device compatibility
  - Different screen resolutions
  - Color scheme preferences
  - Reduced motion support
  - Font size variations

### 8. Security Tests (`security.spec.ts`)
- **Purpose**: Validates security measures and prevents vulnerabilities
- **Coverage**:
  - Sensitive information exposure checks
  - XSS attack prevention
  - Input sanitization
  - Console information leakage
  - Clickjacking protection
  - Secure storage practices

### 9. Visual Regression Tests (`visual-regression.spec.ts`)
- **Purpose**: Monitors visual consistency across updates
- **Coverage**:
  - Page screenshot comparison
  - Component-level visual testing
  - Mobile view validation
  - Dark mode testing
  - Loading state capture
  - Error state visualization

### 10. Load Testing (`load-testing.spec.ts`)
- **Purpose**: Tests application performance under various load conditions
- **Coverage**:
  - Concurrent user simulation
  - Rapid interaction handling
  - Memory-intensive operations
  - Continuous scrolling performance
  - DOM manipulation efficiency
  - Network throttling scenarios

### 11. User Workflow Tests (`user-workflows.spec.ts`)
- **Purpose**: Validates complete user journeys and interactions
- **Coverage**:
  - Full application workflow
  - API exploration patterns
  - Keyboard navigation workflows
  - Mobile user interactions
  - Copy-paste functionality
  - Browser history navigation

### 12. Monitoring Tests (`monitoring.spec.ts`)
- **Purpose**: Provides observability and health metrics
- **Coverage**:
  - Performance metrics collection
  - Network request monitoring
  - Console message analysis
  - Resource caching effectiveness
  - Application health indicators
  - Test execution reporting

## Running Tests

### Prerequisites
```bash
cd frontend
npm install
```

### Test Commands

```bash
# Run all tests
npm run test:e2e

# Run tests with browser UI
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific browser tests
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run mobile tests
npm run test:e2e:mobile

# Debug tests
npm run test:e2e:debug

# View test reports
npm run test:e2e:report
```

### Running Specific Test Files
```bash
# Run specific test suite
npx playwright test main-page.spec.ts
npx playwright test swagger-ui.spec.ts
npx playwright test accessibility.spec.ts

# Run tests matching pattern
npx playwright test --grep "should load"
npx playwright test --grep "mobile"
```

## Configuration

### Playwright Configuration (`playwright.config.ts`)
- **Base URL**: http://localhost:3000
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Reporters**: HTML, JSON, JUnit
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Trace**: On first retry

### Environment Setup
- Tests run against local development server
- Automatic server startup via `webServer` configuration
- Timeout: 120 seconds for server startup
- Network idle state waiting for stable tests

## CI/CD Integration

### GitHub Actions (`../.github/workflows/e2e-tests.yml`)
The test suite is integrated with GitHub Actions for continuous testing:

- **Browser Matrix**: Tests run across Chromium, Firefox, and WebKit
- **Mobile Testing**: Dedicated mobile device testing
- **Accessibility Focus**: Separate accessibility test job
- **Performance Monitoring**: Dedicated performance test execution
- **Artifact Collection**: Test reports, screenshots, and videos uploaded on failure

### Test Artifacts
- **HTML Reports**: Detailed test execution reports
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for failed test scenarios
- **JSON Results**: Machine-readable test results
- **JUnit XML**: For CI integration

## Best Practices

### Test Structure
- Each test file focuses on a specific domain
- Tests are independent and isolated
- Setup and teardown handled automatically
- Clear test descriptions and expectations

### Performance Considerations
- Tests run in parallel when possible
- Resource cleanup after test completion
- Efficient selector strategies
- Minimal wait times with smart waiting

### Maintenance
- Regular test review and updates
- Screenshot baseline management for visual tests
- Performance threshold adjustments
- Accessibility standard updates

## Troubleshooting

### Common Issues
1. **Test Timeouts**: Increase timeout values in playwright.config.ts
2. **Flaky Tests**: Add proper wait conditions and stabilize selectors
3. **Visual Differences**: Update screenshot baselines after legitimate changes
4. **Performance Failures**: Adjust performance thresholds based on environment

### Debug Mode
Use `npm run test:e2e:debug` to:
- Step through tests interactively
- Inspect page state during test execution
- Modify selectors in real-time
- Analyze network and console logs

### Local Development
- Ensure development server is running on port 3000
- Check that all dependencies are installed
- Verify swagger.json is accessible
- Monitor console for any application errors

## Reporting and Metrics

### Test Reports
- **HTML Report**: Comprehensive visual report with screenshots
- **JSON Report**: Machine-readable results for automation
- **JUnit Report**: Compatible with most CI systems
- **Console Output**: Real-time test execution feedback

### Metrics Tracked
- Test execution time
- Performance metrics (FCP, LCP, CLS)
- Network request analysis
- Console message monitoring
- Accessibility compliance scores
- Visual regression detection

This testing suite provides comprehensive coverage ensuring the Nearacles frontend application maintains high quality, performance, and reliability across all supported platforms and use cases.
