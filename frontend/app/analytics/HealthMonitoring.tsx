'use client';

export default function HealthMonitoring() {
  const systemHealth = {
    overall: 98.7,
    services: [
      { name: 'Oracle Network', status: 'healthy', uptime: 99.8, issues: 0 },
      { name: 'HCS Topics', status: 'healthy', uptime: 99.5, issues: 0 },
      { name: 'File Service', status: 'healthy', uptime: 99.9, issues: 0 },
      { name: 'Smart Contracts', status: 'warning', uptime: 97.2, issues: 1 },
      { name: 'Account Service', status: 'healthy', uptime: 99.7, issues: 0 },
      { name: 'Network Services', status: 'healthy', uptime: 98.9, issues: 0 }
    ]
  };

  const alerts = [
    {
      id: 1,
      severity: 'warning',
      service: 'Smart Contracts',
      message: 'Oracle contract response time exceeded 5s threshold',
      timestamp: '12 minutes ago',
      status: 'investigating'
    },
    {
      id: 2,
      severity: 'info',
      service: 'HCS Topics',
      message: 'High message volume detected on Oracle Audit topic',
      timestamp: '25 minutes ago',
      status: 'resolved'
    },
    {
      id: 3,
      severity: 'resolved',
      service: 'Network Services',
      message: 'Node connectivity restored for 0.0.28',
      timestamp: '1 hour ago',
      status: 'resolved'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-700 bg-green-100';
      case 'warning': return 'text-yellow-700 bg-yellow-100';
      case 'error': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'warning': return 'ri-alert-line';
      case 'error': return 'ri-error-warning-line';
      case 'info': return 'ri-information-line';
      case 'resolved': return 'ri-check-line';
      default: return 'ri-notification-line';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 mt-8">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Health Monitoring</h2>
            <p className="text-gray-600 text-sm mt-1">System health checks and alert management</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">{systemHealth.overall}%</div>
            <div className="text-sm text-gray-600">Overall Health Score</div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Service Status</h3>
            <div className="space-y-3">
              {systemHealth.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'healthy' ? 'bg-green-500' : 
                      service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Uptime: {service.uptime}%</span>
                        {service.issues > 0 && (
                          <span className="text-yellow-600">• {service.issues} issue(s)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAlertColor(alert.severity)}`}>
                      <i className={`${getAlertIcon(alert.severity)} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{alert.service}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAlertColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{alert.timestamp}</span>
                        <span className="capitalize">{alert.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">28/28</div>
            <div className="text-sm text-gray-600">Nodes Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">99.8%</div>
            <div className="text-sm text-gray-600">Network Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">4.2s</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">1</div>
            <div className="text-sm text-gray-600">Active Alerts</div>
          </div>
        </div>
      </div>
    </div>
  );
}