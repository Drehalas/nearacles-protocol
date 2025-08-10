'use client';

import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ServicesGrid from '@/components/ServicesGrid';
import SecuritySection from '@/components/SecuritySection';
import StatsSection from '@/components/StatsSection';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <ServicesGrid />
        <SecuritySection />
        <StatsSection />
      </main>
      
      <footer className="bg-gray-900 text-white py-16" role="contentinfo">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <i className="ri-database-2-line text-white text-xl"></i>
                </div>
                <h3 className="font-[\'Pacifico\'] text-2xl">Nearacles</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Advanced NEAR blockchain Oracle platform with multiple data sources, 
                real-time analytics, and enterprise-grade security.
              </p>
              <div className="flex space-x-4">
                <button 
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer"
                  aria-label="Visit our GitHub repository"
                  title="GitHub"
                >
                  <i className="ri-github-line text-gray-300" aria-hidden="true"></i>
                  <span className="sr-only">GitHub</span>
                </button>
                <button 
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer"
                  aria-label="Follow us on Twitter"
                  title="Twitter"
                >
                  <i className="ri-twitter-line text-gray-300" aria-hidden="true"></i>
                  <span className="sr-only">Twitter</span>
                </button>
                <button 
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer"
                  aria-label="Join our Discord community"
                  title="Discord"
                >
                  <i className="ri-discord-line text-gray-300" aria-hidden="true"></i>
                  <span className="sr-only">Discord</span>
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6">Platform</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="/dashboard" className="hover:text-white cursor-pointer">Dashboard</a></li>
                <li><a href="/oracles" className="hover:text-white cursor-pointer">Oracle Network</a></li>
                <li><a href="/analytics" className="hover:text-white cursor-pointer">Analytics</a></li>
                <li><a href="/explorer" className="hover:text-white cursor-pointer">Explorer</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6">Resources</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="/docs" className="hover:text-white cursor-pointer">Documentation</a></li>
                <li><a href="/api" className="hover:text-white cursor-pointer">API Reference</a></li>
                <li><a href="/support" className="hover:text-white cursor-pointer">Support</a></li>
                <li><a href="/status" className="hover:text-white cursor-pointer">Status Page</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Nearacles. All rights reserved. Built on NEAR Protocol.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
