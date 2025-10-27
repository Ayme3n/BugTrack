export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold">BugTrack</h1>
          <p className="text-lg text-center max-w-2xl">
            Your secure command center for bug bounty and pentesting.
            Manage targets, track findings, store payloads, and run security tools from your browser.
          </p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/login"
          >
            Get Started
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="/docs"
          >
            Read Docs
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-4xl">
          <div className="p-6 border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🎯 Target Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organize bug bounty programs and pentest engagements with scope tracking and status management.
            </p>
          </div>

          <div className="p-6 border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🔍 Findings Tracker</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Document vulnerabilities with markdown, attachments, and export professional reports.
            </p>
          </div>

          <div className="p-6 border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg">
            <h3 className="text-lg font-semibold mb-2">💉 Payload Library</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Store and organize your XSS, SQLi, and other payloads with quick-copy and encryption.
            </p>
          </div>

          <div className="p-6 border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🔒 Encrypted Notes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Client-side encrypted notes for sensitive credentials and research—zero-knowledge architecture.
            </p>
          </div>

          <div className="p-6 border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🛠️ Integrated Tools</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Run Subfinder, Httpx, Nuclei, and more from your browser—no VMs needed.
            </p>
          </div>

          <div className="p-6 border border-solid border-black/[.08] dark:border-white/[.145] rounded-lg">
            <h3 className="text-lg font-semibold mb-2">📊 Analytics & Streaks</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your progress with streaks, achievements, and insightful analytics.
            </p>
          </div>
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="/docs"
        >
          Documentation
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/bugtrack/bugtrack"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}

