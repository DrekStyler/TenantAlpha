import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-navy-100">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
              <span className="text-sm font-bold text-gold-400">T</span>
            </div>
            <span className="text-lg font-semibold text-navy-900">
              TenantAlpha
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-navy-600 hover:text-navy-900"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900 sm:text-5xl">
          Compare Lease Options.
          <br />
          <span className="text-gold-500">Make Confident Decisions.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-navy-500 sm:text-lg">
          Enter 2-5 commercial lease options and instantly see NPV, effective
          rent, cash flow analysis, and AI-powered recommendations — all in one
          professional report.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="w-full rounded-lg bg-navy-900 px-6 py-3 text-base font-semibold text-white hover:bg-navy-800 sm:w-auto"
          >
            Start New Analysis
          </Link>
          <Link
            href="/sign-in"
            className="w-full rounded-lg border border-navy-200 px-6 py-3 text-base font-semibold text-navy-700 hover:bg-navy-50 sm:w-auto"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-navy-100 bg-navy-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-navy-900">
            Everything You Need for Lease Analysis
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Side-by-Side Comparison",
                desc: "Enter up to 5 lease options and see them ranked by effective rent, NPV, and total occupancy cost.",
              },
              {
                title: "AI-Powered Insights",
                desc: "Get plain-English analysis of risks, trade-offs, and recommendations powered by advanced AI.",
              },
              {
                title: "Professional PDF Reports",
                desc: "Export branded, C-suite-ready reports with charts, metrics, and AI recommendations in one click.",
              },
              {
                title: "Financial Metrics",
                desc: "NPV, effective rent, payback period, cost per employee, rent-to-revenue ratio, and more.",
              },
              {
                title: "Cash Flow Visualization",
                desc: "Interactive charts showing year-by-year costs, escalation impact, and comparison across options.",
              },
              {
                title: "Save & Resume",
                desc: "Save deal analyses and return to them anytime. Store signed lease records for future reference.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-navy-100 bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-navy-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-navy-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-navy-900">
          Ready to compare your lease options?
        </h2>
        <p className="mt-2 text-navy-500">
          Get a full ROI analysis in under 5 minutes.
        </p>
        <Link
          href="/sign-up"
          className="mt-6 inline-block rounded-lg bg-gold-500 px-8 py-3 text-base font-semibold text-navy-900 hover:bg-gold-400"
        >
          Start Free Analysis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-100 bg-navy-900 px-4 py-6 text-center text-sm text-navy-300">
        <p>&copy; {new Date().getFullYear()} TenantAlpha. All rights reserved.</p>
      </footer>
    </div>
  );
}
