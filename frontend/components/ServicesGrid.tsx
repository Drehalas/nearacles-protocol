'use client';

export default function ServicesGrid() {
  const services = [
    {
      icon: 'ri-cloud-line',
      title: 'NEAR Storage Service',
      description: 'AES-256 encrypted decentralized storage, GDPR & HIPAA compliant with digital ID support and full access audit logs.',
      features: ['AES-256 Encryption', 'GDPR Compliance', 'Digital ID Support', 'Audit Logs']
    },
    {
      icon: 'ri-exchange-line',
      title: 'NEAR Token Service',
      description: 'NEP-141 token creation with oracle-based audit trail, automated pricing, and cross-chain compatibility.',
      features: ['NEP-141 Tokens', 'Oracle Pricing', 'Audit Trail', 'Cross-chain']
    },
    {
      icon: 'ri-code-s-slash-line',
      title: 'Smart Contracts',
      description: 'Rust/AssemblyScript compilation, full deploy pipeline with oracle integration and dynamic provider selection.',
      features: ['Rust Support', 'Deploy Pipeline', 'Oracle Integration', 'Provider Selection']
    },
    {
      icon: 'ri-wallet-3-line',
      title: 'Account Service',
      description: 'Multi-account handling, NEAR balance checks, account creation from keys with transaction signing & auditing.',
      features: ['Multi-account', 'Balance Checks', 'Key Management', 'Transaction Audit']
    },
    {
      icon: 'ri-global-line',
      title: 'Network Services',
      description: 'Testnet/Mainnet switching, gas optimization, validator monitoring with uptime, stake, and reward tracking.',
      features: ['Network Switch', 'Gas Optimization', 'Validator Monitor', 'Reward Tracking']
    },
    {
      icon: 'ri-search-eye-line',
      title: 'NEAR Explorer',
      description: 'Multi-entity URLs, visual status badges, batch tracking with comprehensive blockchain data exploration.',
      features: ['Multi-entity', 'Status Badges', 'Batch Tracking', 'Data Explorer']
    },
    {
      icon: 'ri-cpu-line',
      title: 'Oracle Consensus',
      description: 'Median, weighted average, majority vote algorithms with 3-sigma outlier filtering and confidence weighting.',
      features: ['Multiple Algorithms', 'Outlier Filtering', 'Confidence Weight', 'Real-time Processing']
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Security Layer',
      description: 'Role-based access control, AES-256 encryption, digital signatures with input validation and audit trails.',
      features: ['Role-based Access', 'Digital Signatures', 'Input Validation', 'Security Audit']
    },
    {
      icon: 'ri-line-chart-line',
      title: 'Analytics & Monitoring',
      description: 'Real-time health checks, TPS monitoring, success rate tracking with comprehensive cost analysis.',
      features: ['Health Checks', 'TPS Monitoring', 'Success Rates', 'Cost Analysis']
    },
    {
      icon: 'ri-message-3-line',
      title: 'Consensus Messaging',
      description: '4 custom audit topics with real-time & batch messaging, auto-topic creation with smart batching algorithms.',
      features: ['4 Audit Topics', 'Real-time Messaging', 'Auto-creation', 'Smart Batching']
    },
    {
      icon: 'ri-bubble-chart-line',
      title: 'Data Feeds',
      description: 'Integration with 9 oracle providers, real-time price feeds, quality metrics with staleness detection.',
      features: ['9 Providers', 'Real-time Feeds', 'Quality Metrics', 'Staleness Check']
    }
  ];

  return (
    <section className="py-24 bg-white" aria-labelledby="services-heading">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 id="services-heading" className="text-4xl font-bold text-gray-900 mb-4">
            Comprehensive NEAR Oracle Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            11 full services providing enterprise-grade oracle infrastructure 
            with 75+ API endpoints and production-ready scalability
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mb-6">
                <i className={`${service.icon} text-white text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {service.description}
              </p>
              <ul className="space-y-2">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}