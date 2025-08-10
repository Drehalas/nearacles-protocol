'use client';

export default function SecuritySection() {
  const algorithms = [
    {
      name: 'Weighted Average',
      description: 'Provider reliability-based weighting with historical performance metrics',
      accuracy: '99.7%'
    },
    {
      name: 'Median Consensus',
      description: 'Statistical median calculation with outlier resistance',
      accuracy: '99.5%'
    },
    {
      name: 'Majority Vote',
      description: 'Democratic consensus with confidence-weighted voting',
      accuracy: '99.8%'
    },
    {
      name: '3-Sigma Filter',
      description: 'Advanced outlier detection with 30% deviation threshold',
      accuracy: '99.9%'
    }
  ];

  const securityFeatures = [
    { icon: 'ri-shield-keyhole-line', title: 'AES-256 Encryption', desc: 'Military-grade encryption for all data' },
    { icon: 'ri-fingerprint-line', title: 'Digital Signatures', desc: 'Cryptographic validation for all transactions' },
    { icon: 'ri-user-settings-line', title: 'Role-based Access', desc: 'Granular permission management system' },
    { icon: 'ri-audit-line', title: 'Complete Audit Trail', desc: 'Immutable logging of all platform activities' }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Advanced Consensus Algorithms
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Multiple oracle consensus mechanisms with sophisticated outlier filtering 
              and confidence-weighted aggregation for maximum data reliability.
            </p>
            
            <div className="space-y-6">
              {algorithms.map((algo, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900">{algo.name}</h3>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {algo.accuracy}
                    </span>
                  </div>
                  <p className="text-gray-600">{algo.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Enterprise Security
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Multi-layered security architecture with role-based access control, 
              encryption, and comprehensive audit trails for enterprise compliance.
            </p>
            
            <div className="space-y-6">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className={`${feature.icon} text-white text-xl`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-900 mb-2">GDPR & HIPAA Compliant</h4>
              <p className="text-green-800">
                Full compliance with global data protection regulations including 
                GDPR, HIPAA, and SOX requirements for enterprise deployments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}