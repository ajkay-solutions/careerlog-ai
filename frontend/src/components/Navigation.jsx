import React from 'react';

const Navigation = ({ user, onLogout, currentView = 'journal', onViewChange }) => {
  const navItems = [
    { id: 'journal', label: 'Journal', icon: '📝', href: '/journal' },
    { id: 'insights', label: 'Insights', icon: '📊', href: '/insights' },
    { id: 'generate', label: 'Generate', icon: '✨', href: '/generate' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">WL</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">WorkLog AI</h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange && onViewChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Right: User menu */}
        <div className="flex items-center gap-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {user?.displayName || 'User'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.email}
              </div>
            </div>
            
            {/* User avatar */}
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span className="text-gray-600 text-sm font-medium">
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Dropdown menu */}
            <div className="relative">
              <button
                onClick={onLogout}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;