<footer className="bg-gray-800 text-white text-center p-4">
  © {new Date().getFullYear()} EchoWrite. All rights reserved.
  
  {/* Jenkins & Haroon Test Buttons */}
  <div className="mt-4 space-x-4">
    <button 
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      onClick={() => alert('Jenkins button clicked!')}
    >
      Jenkins
    </button>

    <button 
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
      onClick={() => alert('Haroon button clicked!')}
    >
      Haroon
    </button>
  </div>

  <div className="mt-2 space-x-4 text-xs">
    <Link to="/terms-of-service" className="text-gray-400 hover:text-white hover:underline">Terms of Service</Link>
    <span className="text-gray-500">|</span>
    <Link to="/privacy-policy" className="text-gray-400 hover:text-white hover:underline">Privacy Policy</Link>
    <span className="text-gray-500">|</span>
    <Link to="/refund-policy" className="text-gray-400 hover:text-white hover:underline">Refund Policy</Link>
  </div>
</footer>
