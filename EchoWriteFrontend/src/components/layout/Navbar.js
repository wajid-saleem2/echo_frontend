// // frontend/src/components/layout/Navbar.js
// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import ThemeToggle from './ThemeToggle'; // <<<< IMPORT

// const Navbar = React.memo(() => {
//     const { user, logout } = useAuth();
//     const navigate = useNavigate();
//     console.log("Rendering Navbar"); // For debugging
//     const handleLogout = () => {
//         logout();
//         navigate('/login');
//     };

//     return (
//         <nav className="bg-slate-800 dark:bg-gray-900 text-white p-4 shadow-md"> {/* Example dark mode for navbar itself */}
//             <div className="container mx-auto flex justify-between items-center">
//                 <Link to="/" className="text-2xl font-bold hover:text-gray-300">
//                     EchoWrite
//                 </Link>
//                 <div className="flex items-center space-x-4"> {/* Wrapper for nav items and toggle */}
//                 <ul className="flex space-x-4 items-center">
//                     {user ? (
//                         <>
//                             <li>
//                                 <Link to="/dashboard" className="hover:text-gray-300">
//                                     Dashboard
//                                 </Link>
//                             </li>
//                             <li>
//                                 <Link to="/profile" className="hover:text-gray-300">
//                                     Profile
//                                 </Link>
//                             </li>
//                             <li>
//                                 <Link to="/templates" className="hover:text-gray-300">
//                                     Templates
//                                 </Link>
//                             </li>
//           <li>
//                                 <Link to="/community-templates" className="hover:text-gray-300">
//                                     Community Templates
//                                 </Link>
//                             </li>
//                             <li>
//                                 <span className="text-gray-400">Welcome, {user.username}!</span>
//                             </li>
//                             <li>
//                                 <button
//                                     onClick={handleLogout}
//                                     className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
//                                 >
//                                     Logout
//                                 </button>
//                             </li>
//                         </>
//                     ) : (
//                         <>
//                             <li>
//                                 <Link to="/login" className="hover:text-gray-300">
//                                     Login
//                                 </Link>
//                             </li>
//                             <li>
//                                 <Link to="/register" className="hover:text-gray-300">
//                                     Register
//                                 </Link>
//                             </li>
//                         </>
//                     )}
//                 </ul>
//                 <ThemeToggle /> {/* <<<< ADD THE TOGGLE BUTTON */}
//                 </div>
//             </div>
//         </nav>
//     );
// });

// export default Navbar;

// frontend/src/components/layout/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from './ThemeToggle'; // Retained

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleChoosePlan = () => {
    // Navigate to register page with step 2 parameter
    navigate('/register?step=2');
  };

  const hasActiveSubscription = user?.subscription?.isActive;

  return (
    <nav className="bg-slate-800 dark:bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-2xl font-bold hover:text-gray-300">
            EchoWrite
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/" className="hover:text-gray-300 px-3 py-2 rounded-md">Home</Link>
                <Link to="/login" className="hover:text-gray-300 px-3 py-2 rounded-md">Login</Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md font-medium text-white">Get Started</Link>
              </>
            ) : !hasActiveSubscription ? (
              <>
                <Link to="/" className="hover:text-gray-300 px-3 py-2 rounded-md">Home</Link>
                <button 
                  onClick={handleChoosePlan}
                  className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-md font-medium text-white"
                >
                  Choose Plan
                </button>
                <div className="relative">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="hover:text-gray-300 px-3 py-2 rounded-md">
                    {user.username} ⚠️
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-red-600">Subscription Inactive</div>
                      </div>
                      <button 
                        onClick={() => { handleChoosePlan(); setIsMenuOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                      >
                        Activate Subscription
                      </button>
                      <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="hover:text-gray-300 px-3 py-2 rounded-md">Dashboard</Link>
                <Link to="/all-content" className="hover:text-gray-300 px-3 py-2 rounded-md">My Content</Link>
                <Link to="/ai-tools" className="hover:text-gray-300 px-3 py-2 rounded-md">AI Tools</Link>
                <Link to="/community-templates" className="hover:text-gray-300 px-3 py-2 rounded-md">AI Tools</Link>

                <div className="relative">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="hover:text-gray-300 px-3 py-2 rounded-md">
                    {user.username} ✓
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-green-600">{user.subscription?.plan} Plan</div>
                      </div>
                      <Link to="/profile" className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                      <Link to="/templates" className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Templates</Link>
                      <Link to="/manage-personas" className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>Personas</Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>
                      )}
                      <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block w-full text-gray-700 text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300">Logout</button>
                    </div>
                  )}
                </div>
              </>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-gray-300 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800 dark:bg-gray-900">
              {!user ? (
                <>
                  <Link to="/" className="block hover:text-gray-300 px-3 py-2 rounded-md">Home</Link>
                  <Link to="/login" className="block hover:text-gray-300 px-3 py-2 rounded-md">Login</Link>
                  <Link to="/register" className="block bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-md font-medium">Get Started</Link>
                </>
              ) : !hasActiveSubscription ? (
                <>
                  <Link to="/" className="block hover:text-gray-300 px-3 py-2 rounded-md">Home</Link>
                  <button 
                    onClick={() => { handleChoosePlan(); setIsMenuOpen(false); }}
                    className="block w-full text-left bg-yellow-600 hover:bg-yellow-500 px-3 py-2 rounded-md font-medium"
                  >
                    Choose Plan
                  </button>
                  <div className="px-3 py-2 text-yellow-300 text-sm">⚠️ Subscription Inactive</div>
                  <button onClick={handleLogout} className="block w-full text-left hover:text-gray-300 px-3 py-2 rounded-md">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="block hover:text-gray-300 px-3 py-2 rounded-md">Dashboard</Link>
                  <Link to="/all-content" className="block hover:text-gray-300 px-3 py-2 rounded-md">My Content</Link>
                  <Link to="/ai-tools" className="block hover:text-gray-300 px-3 py-2 rounded-md">AI Tools</Link>
                  <Link to="/profile" className="block hover:text-gray-300 px-3 py-2 rounded-md">Profile</Link>
                  <div className="px-3 py-2 text-green-300 text-sm">✓ {user.subscription?.plan} Plan</div>
                  <button onClick={handleLogout} className="block w-full text-left hover:text-gray-300 px-3 py-2 rounded-md">Logout</button>
                </>
              )}
              <div className="mt-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;