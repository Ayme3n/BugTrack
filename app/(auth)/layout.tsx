/**
 * Auth Layout - Centered layout for login/register pages
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            BugTrack
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your secure research workflow platform
          </p>
        </div>

        {/* Auth Form Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {children}
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          <a href="/" className="hover:text-gray-900 dark:hover:text-gray-200">
            Back to Home
          </a>
          {' · '}
          <a href="/docs" className="hover:text-gray-900 dark:hover:text-gray-200">
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}

