const sections = [
  {
    title: "What Track Anything Stores",
    body: [
      "Track Anything lets you create profiles, names, labels, values, units, entries, history, and charts. This tracker data is saved on your device using app-local storage.",
      "Track Anything does not require an account. Tracker data is not sent to developer servers.",
    ],
  },
  {
    title: "Data Collection And Sharing",
    body: [
      "Track Anything does not collect personal information from the app developer side, does not sell user data, does not use advertising SDKs, and does not use analytics SDKs.",
      "Tracker data remains on your device unless you choose to share it outside the app through your own device tools.",
    ],
  },
  {
    title: "Optional Tips And Google Play Billing",
    body: [
      "Track Anything may offer optional one-time tips through Google Play Billing. Payments are processed by Google Play. Track Anything does not collect or store your payment card number, bank information, or Google account credentials.",
      "Google may process purchase and payment information under Google's own terms and privacy policy.",
    ],
  },
  {
    title: "Permissions",
    body: [
      "The Android app may include Internet access for the app runtime and Google Play Billing. Track Anything does not use this permission to upload tracker entries to developer servers.",
      "The app may include Google Play Billing permission to support optional tips.",
    ],
  },
  {
    title: "Retention And Deletion",
    body: [
      "Tracker data stays on your device until you delete entries or profiles in the app, clear app storage, or uninstall the app.",
      "Because Track Anything does not create developer-hosted accounts, there is no server account for the developer to delete.",
    ],
  },
  {
    title: "Security",
    body: [
      "Tracker data is stored locally on your device. Your device security settings, operating system, backups, and other apps may affect how that local data is protected.",
      "Use your device lock screen and keep your operating system updated to help protect your local data.",
    ],
  },
  {
    title: "Children",
    body: [
      "Track Anything is not directed to children under 13. If this changes, this privacy policy and the Google Play disclosures will be updated.",
    ],
  },
  {
    title: "Changes",
    body: [
      "This privacy policy may be updated when Track Anything changes how it handles data. Updates will be posted on this page with a new effective date.",
    ],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#18201b]">
      <section className="border-b border-[#dfe5dc] bg-[#eef3eb] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase text-[#44604c]">
            Track Anything
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#3e4c42]">
            Effective date: June 16, 2026. This policy applies to the Track
            Anything Android app, package <code>com.trackanything.app</code>.
          </p>
        </div>
      </section>

      <section className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="border-b border-[#dfe5dc] pb-8">
            <h2 className="text-2xl font-semibold">Summary</h2>
            <p className="mt-4 text-base leading-8 text-[#3e4c42]">
              Track Anything stores tracker data on your device. It has no
              developer-hosted account system, no ads, no analytics SDK, and no
              developer server upload for your tracker entries. Optional tips
              use Google Play Billing.
            </p>
          </div>

          <div className="divide-y divide-[#dfe5dc]">
            {sections.map((section) => (
              <section key={section.title} className="py-8">
                <h2 className="text-2xl font-semibold">{section.title}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base leading-8 text-[#3e4c42]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="border-t border-[#dfe5dc] py-8">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="mt-4 text-base leading-8 text-[#3e4c42]">
              Privacy questions can be sent through the developer contact shown
              on Google Play, or opened as an issue at{" "}
              <a
                className="font-semibold text-[#245f42] underline underline-offset-4"
                href="https://github.com/PearceMullins/Fitness-Tracker/issues"
              >
                github.com/PearceMullins/Fitness-Tracker/issues
              </a>
              .
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
