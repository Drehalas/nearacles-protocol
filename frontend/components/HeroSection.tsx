'use client';

export default function HeroSection() {
  return (
    <div 
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center"
      style={{
        backgroundImage: "url('https://readdy.ai/api/search-image?query=Futuristic%20blockchain%20network%20visualization%20with%20glowing%20green%20and%20blue%20nodes%20connected%20by%20energy%20streams%2C%20digital%20oracle%20data%20flowing%20through%20transparent%20tubes%2C%20NEAR%20protocol%20inspired%20design%20with%20clean%20geometric%20patterns%2C%20modern%20cyberpunk%20aesthetic%20with%20neon%20accents%2C%20dark%20background%20with%20bright%20connectivity%20lines%20showing%20decentralized%20data%20exchange%20between%20multiple%20oracle%20sources%2C%20high-tech%20atmosphere&width=1920&height=1080&seq=nearacles-hero-bg&orientation=landscape')"
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-3xl">
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            NEAR Protocol<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
              Oracle Network
            </span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
            Advanced NEAR blockchain oracle platform with multiple data sources, 
            real-time consensus algorithms, and enterprise-grade security for 
            decentralized applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-lg font-semibold text-lg whitespace-nowrap cursor-pointer"
              aria-label="Launch the Nearacles Oracle Platform"
              title="Launch Platform"
            >
              Launch Platform
            </button>
            <button 
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg whitespace-nowrap cursor-pointer"
              aria-label="View platform documentation and guides"
              title="View Documentation"
            >
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}