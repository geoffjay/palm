export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 
                    flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 10.74s9-5.19 9-10.74V7l-10-5z" />
            </svg>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="mb-4">
          <div className="w-8 h-8 border-3 border-slate-300 dark:border-slate-600 border-t-blue-600 
                         rounded-full animate-spin mx-auto"></div>
        </div>

        {/* Loading Text */}
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Loading your account...
        </p>
      </div>
    </div>
  );
}
