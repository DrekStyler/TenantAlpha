import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-navy-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900">
              <span className="text-sm font-bold text-gold-400">T</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-navy-900">
              TenantAlpha
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-navy-600 hover:text-navy-900"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-32">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-600">
          Commercial Real Estate Analysis
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
          Compare Lease Options.
          <br />
          <span className="text-gold-500">Make Confident Decisions.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-navy-500 sm:text-lg">
          Enter 2-5 commercial lease options and instantly see NPV, effective
          rent, cash flow analysis, and AI-powered recommendations — all in one
          professional report.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="w-full rounded-lg bg-navy-900 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-navy-800 sm:w-auto"
          >
            Start New Analysis
          </Link>
          <Link
            href="/sign-in"
            className="w-full rounded-lg border border-navy-200 px-8 py-3.5 text-base font-semibold text-navy-700 hover:bg-navy-50 sm:w-auto"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-navy-100 bg-navy-50/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6 sm:py-20">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-navy-900">Side-by-Side Comparison</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">
              Compare up to 5 lease options with NPV, effective rent, and cash flow analysis.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-navy-900">AI-Powered Insights</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">
              Get executive summaries and ask follow-up questions powered by AI analysis.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-navy-900">Professional PDF Reports</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">
              Export branded, client-ready PDF reports with charts and recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-20 text-center sm:px-6 sm:py-24">
        <h2 className="text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
          Ready to compare your lease options?
        </h2>
        <p className="mt-3 text-base text-navy-500">
          Get a full ROI analysis in under 5 minutes.
        </p>
        <Link
          href="/sign-up"
          className="mt-8 inline-block rounded-lg bg-gold-500 px-8 py-3.5 text-base font-semibold text-navy-900 shadow-sm hover:bg-gold-400"
        >
          Start Free Analysis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-200 bg-navy-900 px-4 py-8 text-center text-sm text-navy-300">
        <p>&copy; {new Date().getFullYear()} TenantAlpha. All rights reserved.</p>
      </footer>
    </div>
  );
}
