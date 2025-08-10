'use client';

export default function VersionInfo() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">
            Nearacles <span className="font-semibold text-green-600">v1.0</span>
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Cache-optimized sharing
        </div>
      </div>
    </div>
  );
}