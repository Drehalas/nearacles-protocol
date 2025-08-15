'use client';

export default function StatsSection() {
  const stats = [
    { number: '15,000+', label: 'Lines of Code', icon: 'ri-code-line' },
    { number: '11', label: 'Full Services', icon: 'ri-service-line' },
    { number: '75+', label: 'API Endpoints', icon: 'ri-api-line' },
    { number: '9', label: 'Oracle Providers', icon: 'ri-database-line' },
    { number: '4', label: 'Audit Topics', icon: 'ri-audit-line' },
    { number: '99.9%', label: 'Uptime SLA', icon: 'ri-time-line' }
  ];

  return (
    <section className="py-24 bg-gradient-to-r from-green-600 to-blue-600" aria-labelledby="stats-heading">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 id="stats-heading" className="text-4xl font-bold text-white mb-4">
            Production-Grade Platform
          </h2>
          <p className="text-xl text-green-100">
            Scalable, secure, and real-time oracle infrastructure built for enterprise needs
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <i className={`${stat.icon} text-white text-2xl`}></i>
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-green-100 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Built on NEAR Protocol
            </h3>
            <p className="text-green-100 text-lg leading-relaxed">
              Leveraging NEAR&apos;s fast finality, low costs, and developer-friendly environment 
              to deliver the most advanced oracle network in the ecosystem. Our platform 
              processes thousands of data points per second with sub-second latency and 
              enterprise-grade reliability.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}