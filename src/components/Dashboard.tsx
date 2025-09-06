interface User {
  userId: string;
  email: string;
  name: string;
  picture: string;
  createdAt: number;
  lastActivity: number;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 10.74s9-5.19 9-10.74V7l-10-5z" />
                </svg>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-slate-900 dark:text-white">
                Dashboard
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full ring-2 ring-slate-200 dark:ring-slate-700"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300
                         hover:text-slate-900 dark:hover:text-white
                         hover:bg-slate-100 dark:hover:bg-slate-700
                         rounded-md transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-8">
          <div className="text-center">
            <div className="mb-6">
              <img
                src={user.picture}
                alt={user.name}
                className="w-24 h-24 rounded-full mx-auto ring-4 ring-slate-200 dark:ring-slate-700"
              />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome, {user.name}!
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              You're successfully signed in to your account.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* User Info Card */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Profile Information
                </h3>
                <div className="space-y-3 text-left">
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Name:
                    </span>
                    <p className="text-slate-900 dark:text-white">{user.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Email:
                    </span>
                    <p className="text-slate-900 dark:text-white">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      User ID:
                    </span>
                    <p className="text-slate-900 dark:text-white font-mono text-xs">
                      {user.userId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Session Info Card */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Session Information
                </h3>
                <div className="space-y-3 text-left">
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Created:
                    </span>
                    <p className="text-slate-900 dark:text-white">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Last Activity:
                    </span>
                    <p className="text-slate-900 dark:text-white">
                      {new Date(user.lastActivity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300
                                   bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500
                                   rounded-md hover:bg-slate-50 dark:hover:bg-slate-500
                                   transition-colors">
                    View Profile
                  </button>
                  <button className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300
                                   bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500
                                   rounded-md hover:bg-slate-50 dark:hover:bg-slate-500
                                   transition-colors">
                    Settings
                  </button>
                  <button 
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300
                             bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700
                             rounded-md hover:bg-red-100 dark:hover:bg-red-800
                             transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
