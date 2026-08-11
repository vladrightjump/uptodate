import type { Round } from "../types";

export const ROUND_D: Round = {
  id: "round-d",
  label: "Round D — Mobile Testing",
  desc: "Mobile-focused round: mobile-specific risks, a form to design tests for, compatibility",
  questions: [
    {
      id: "d1",
      q: "What tests would you perform on mobile applications?",
      diff: "mid",
      tags: ["mobile"],
      answer: `<p>Group them — a list of twenty random ideas sounds junior; six categories sound senior.</p>
<p><strong>1. Functional</strong> — the features themselves: flows, business rules, validations, navigation, error handling, plus login/logout and session behaviour.</p>
<p><strong>2. Installation & lifecycle</strong></p>
<ul>
<li>Fresh install, <strong>upgrade over an existing version</strong> (does the user's data survive?), reinstall, uninstall (is data cleaned up?).</li>
<li>App killed by the OS in the background and resumed — state restored or gracefully restarted.</li>
<li>First launch, permission prompts, onboarding.</li>
</ul>
<p><strong>3. Interruptions</strong> — the classic mobile category:</p>
<ul>
<li>Incoming call or SMS mid-flow; push notification; alarm; calendar reminder.</li>
<li>App backgrounded and returned to; device locked and unlocked; low battery / battery saver mode; low memory.</li>
<li>OS update, time-zone or clock change, device restart while a task is pending.</li>
</ul>
<p><strong>4. Network</strong></p>
<ul>
<li>WiFi, 5G/4G/3G, and switching between them mid-request.</li>
<li>Offline behaviour: clear message, cached content, queued actions, sync when connectivity returns.</li>
<li>Slow and flaky connections, airplane mode, timeouts, captive-portal WiFi.</li>
</ul>
<p><strong>5. Device & UI</strong></p>
<ul>
<li>Screen sizes and densities, notch/safe areas, orientation change (does the form keep its input?), split screen / foldables.</li>
<li>Soft keyboard overlapping fields, correct keyboard type per field (email, numeric), autocorrect interference.</li>
<li>Gestures: tap, long press, swipe, pinch, scroll; touch-target size; back button (Android hardware/gesture back).</li>
<li>Dark mode, system font scaling, OS-level accessibility settings.</li>
</ul>
<p><strong>6. Permissions</strong> — camera, location, contacts, notifications, storage: granted, denied, "only this time", revoked from settings while the app runs.</p>
<p><strong>7. Non-functional</strong></p>
<ul>
<li><strong>Performance</strong> — cold/warm start time, scrolling smoothness, memory leaks over a long session.</li>
<li><strong>Battery and data consumption</strong>; app size.</li>
<li><strong>Security</strong> — no sensitive data in local storage or logs, certificate pinning, secure keychain, biometric login, screenshot/backgrounding privacy.</li>
<li><strong>Compatibility</strong> across OS versions and devices; <strong>accessibility</strong> with TalkBack/VoiceOver.</li>
<li><strong>Store readiness</strong> — deep links, push notifications, app store guidelines, versioning, crash reporting.</li>
</ul>
<p>Mention tooling: real devices plus emulators (real devices for anything performance-, gesture- or network-related), device farms (BrowserStack/Sauce Labs), Appium/Espresso/XCUITest for automation, Charles Proxy for network manipulation, logcat/Xcode console for logs.</p>`,
    },
    {
      id: "d2",
      q: "You have a web application and a mobile application with the same core functionalities. What additional tests would you do on the mobile app?",
      diff: "mid",
      tags: ["mobile", "strategy"],
      answer: `<p>Start with the framing: <strong>the business logic is shared, so it doesn't need re-verifying from scratch</strong> — especially if both clients hit the same backend. The extra effort belongs to everything the mobile platform adds. Then list what's genuinely new:</p>
<ul>
<li><strong>Interruptions</strong> — calls, notifications, alarms, backgrounding, OS killing the app, device lock. No web equivalent.</li>
<li><strong>Install / upgrade / uninstall</strong> — including upgrading over an old version with existing data, and the store build itself.</li>
<li><strong>Offline and unreliable networks</strong> — mobile users lose connection constantly; web users mostly don't. Caching, queueing, sync, conflict handling.</li>
<li><strong>Device permissions</strong> — camera, location, notifications, biometrics, and the denied/revoked paths.</li>
<li><strong>Gestures and touch</strong> — swipe, long press, pinch, pull-to-refresh, touch-target size, no hover state (any web feature that depends on hover needs a mobile alternative).</li>
<li><strong>Hardware/OS integration</strong> — Android back button and gesture navigation, share sheet, deep links, push notifications, biometric unlock, clipboard, camera/gallery.</li>
<li><strong>Screen and layout</strong> — small viewports, notch/safe area, orientation change mid-form, split screen, foldables, system font scaling, dark mode.</li>
<li><strong>Soft keyboard</strong> — covering the field being typed into, correct keyboard type, "Next/Done" behaviour, autocorrect mangling input.</li>
<li><strong>Fragmentation</strong> — OS versions and device models, low-end hardware; the web equivalent (browsers) is far less varied.</li>
<li><strong>Resources</strong> — battery drain, mobile-data usage, memory on low-end devices, cold start time, app size.</li>
<li><strong>Mobile-specific security</strong> — data at rest on the device, logs, screenshots in the app switcher, jailbroken/rooted devices.</li>
<li><strong>Version coexistence</strong> — unlike the web, users don't all update. An old app version must still work against the current API (backward compatibility), and force-update must work when it doesn't.</li>
</ul>
<p>That last point is the one most candidates miss and it's a genuinely important difference: on the web everyone runs the latest version the moment you deploy; on mobile you support several versions at once.</p>
<p>Finish with the cross-client checks: data created on mobile appears correctly on web and vice versa, and the same account behaves consistently on both.</p>`,
    },
    {
      id: "d3",
      q: "What tests would you write for a form with: first name, last name, gender (optional radio buttons), date of birth (hardcoded), address, and Save / Cancel buttons?",
      diff: "mid",
      tags: ["test-design"],
      answer: `<p>Work through it systematically — field by field, then the form as a whole.</p>

<p><strong>Positive path</strong></p>
<ul>
<li>All fields filled correctly + Save → record saved, success message, correct data persisted (verify in the DB/API, not just the UI).</li>
<li>Only the mandatory fields filled (gender omitted, since it's optional) → still saves successfully.</li>
<li>Reopen the form → saved values are displayed correctly.</li>
</ul>

<p><strong>First name / last name</strong></p>
<ul>
<li>Required or not — empty submit shows the right error.</li>
<li>Boundary values on length: min−1, min, min+1, max, max+1; paste a 1000-character string.</li>
<li>Valid special cases that must be accepted: apostrophes (O'Brien), hyphens (Anne-Marie), spaces (van der Berg), accents and non-Latin characters (Иван, 李).</li>
<li>Invalid: digits, symbols, only spaces, leading/trailing spaces (trimmed?), emoji.</li>
<li>Injection payloads: <code>&lt;script&gt;alert(1)&lt;/script&gt;</code>, <code>' OR '1'='1</code> — must be stored/escaped safely, and must not execute when displayed back.</li>
</ul>

<p><strong>Gender (optional radio buttons)</strong></p>
<ul>
<li>No option selected by default (it's optional) — and saving with none selected works.</li>
<li>Selecting an option works; only one can be selected at a time (that's the point of radios — if two can be selected, it's a checkbox bug).</li>
<li>Can the selection be cleared once made? Often it can't — decide whether that's intended and raise it if not.</li>
<li>Selected value is persisted and re-displayed correctly after reopening.</li>
<li>Keyboard: arrow keys move between options, the group is reachable by Tab as a single stop, the label text is clickable.</li>
</ul>

<p><strong>Date of birth (hardcoded / read-only)</strong></p>
<ul>
<li>Confirm it really is read-only: cannot be typed into, cannot be edited via dev tools <em>and</em> — crucially — if the value is changed in the request payload, the <strong>server ignores or rejects it</strong>. A read-only field enforced only in the UI is a security finding.</li>
<li>Displayed in the correct format and locale (dd/mm/yyyy vs mm/dd/yyyy — 03/04 is ambiguous and a classic bug), correct time-zone handling so the date doesn't shift by a day.</li>
<li>The value is the correct one for that user, and any derived logic (age, eligibility) matches it.</li>
<li>Visually distinguishable as non-editable, and still announced correctly by a screen reader.</li>
</ul>

<p><strong>Address</strong></p>
<ul>
<li>Structured or free text? If structured: street, number, city, postcode, country — each with its own validation. Postcode format per country is a common trap.</li>
<li>Long addresses, multi-line input, special characters, non-Latin scripts, apartment numbers like "12/A".</li>
<li>If there's autocomplete/lookup: selecting a suggestion fills the fields correctly, and a manual entry that isn't in the list is still accepted.</li>
</ul>

<p><strong>Buttons</strong></p>
<ul>
<li><strong>Save</strong> — enabled/disabled logic; disabled while submitting; double-click doesn't create two records; success and failure feedback; behaviour when the server returns an error (data not lost from the form).</li>
<li><strong>Cancel</strong> — discards changes, doesn't save anything, returns to the previous screen; with unsaved changes it should warn ("Discard changes?") rather than silently losing them.</li>
<li>Cancel on an empty form; Save immediately after Cancel; navigating away with the browser back button.</li>
</ul>

<p><strong>Form-level</strong></p>
<ul>
<li>Tab order is logical; Enter submits (or deliberately doesn't); focus moves to the first error on failed validation.</li>
<li>All errors shown at once vs one at a time; errors clear when the field is corrected.</li>
<li>Data persistence on refresh mid-edit; session timeout while the form is open — the user shouldn't lose everything silently.</li>
<li>Editing an existing record vs creating a new one; duplicate detection if relevant.</li>
</ul>

<p><strong>Non-functional</strong> — accessibility (every input has a label, errors announced, keyboard-only completion possible, contrast), responsive layout, browser compatibility, and the API-level checks: send the request directly with missing/oversized/invalid fields and confirm the server validates independently of the UI.</p>`,
    },
    {
      id: "d4",
      q: "What tests for that form should be performed if you open it on a mobile app?",
      diff: "mid",
      tags: ["mobile", "test-design"],
      answer: `<p>Everything from the web form still applies — plus the mobile layer:</p>
<p><strong>Keyboard behaviour (the biggest source of real bugs here)</strong></p>
<ul>
<li>The soft keyboard must not cover the field being typed into — check the last fields on the form, especially Address and the Save button.</li>
<li>Correct keyboard type per field: text for names, and if the address has a numeric part, a numeric pad.</li>
<li>"Next" moves to the following field in the right order, "Done" dismisses or submits appropriately.</li>
<li>Autocorrect/autocapitalise doesn't mangle names; predictive text doesn't insert unwanted words.</li>
<li>Dismissing the keyboard by tapping outside doesn't lose input or trigger Cancel.</li>
</ul>
<p><strong>Layout and interaction</strong></p>
<ul>
<li><strong>Rotation mid-entry</strong> — entered values, radio selection and scroll position survive the orientation change. Losing input on rotate is a classic Android defect.</li>
<li>Small screens: fields not truncated, the read-only date of birth still fully readable, long address text wraps rather than clipping.</li>
<li>Touch targets — radio buttons and Save/Cancel large enough (≈44–48 dp) and not too close together; the label text is tappable, not just the tiny circle.</li>
<li>Scrolling with the keyboard open; the form scrolls rather than the page behind it; pull-to-refresh doesn't wipe the form.</li>
<li>Safe areas / notch, split screen, large system font sizes, dark mode.</li>
</ul>
<p><strong>Lifecycle and interruptions</strong></p>
<ul>
<li>Incoming call or notification mid-form → returning to the app keeps the entered data.</li>
<li>App backgrounded and killed by the OS → is a draft restored, or at least is the loss handled gracefully with a warning?</li>
<li>Device lock/unlock, low-memory conditions, app switcher.</li>
<li>Android <strong>hardware/gesture back</strong> — treated like Cancel? Does it warn about unsaved changes? Doesn't silently discard data.</li>
</ul>
<p><strong>Network</strong></p>
<ul>
<li>Save with no connection → clear error, form data preserved, retry possible (or queued and synced later).</li>
<li>Save on a slow connection → loading indicator, button disabled so it can't be tapped twice, no duplicate record when the request finally lands.</li>
<li>Connection lost <em>during</em> the save — the crucial one: did it save or not? Verify no duplicate and no partial record.</li>
</ul>
<p><strong>Platform extras</strong> — paste from clipboard into the fields, native autofill (address/contact autofill), voice input, accessibility with TalkBack/VoiceOver (each field announced with its label, radio group announced as a group, the read-only field announced as read-only), and iOS vs Android behavioural differences.</p>`,
    },
    {
      id: "d5",
      q: "What are the types of compatibility testing?",
      diff: "mid",
      tags: ["theory", "compatibility"],
      answer: `<p>Compatibility testing checks that the software works across the environments it's meant to run in. The main split is <strong>backward vs forward</strong>, then by dimension.</p>
<p><strong>By direction</strong></p>
<ul>
<li><strong>Backward compatibility</strong> — the new version still works with older environments, older data and older clients. E.g. a new API version still serves last year's mobile app; a new app version still opens files/settings saved by the previous one.</li>
<li><strong>Forward compatibility</strong> — the current version keeps working with newer environments, e.g. the app survives the next OS release. Harder to test, usually done against beta OS builds.</li>
</ul>
<p><strong>By dimension</strong></p>
<ul>
<li><strong>Browser</strong> — Chrome, Safari, Firefox, Edge; current and previous versions; rendering engines differ (Safari/WebKit is the usual offender).</li>
<li><strong>Operating system</strong> — Windows/macOS/Linux; Android 12–15, iOS 16–18; the oldest version you officially support.</li>
<li><strong>Device / hardware</strong> — phones, tablets, low-end vs flagship, foldables, different CPU/RAM, camera and sensor availability.</li>
<li><strong>Screen</strong> — resolutions, aspect ratios, pixel density, orientation, notch/safe areas, split screen. (Often called <em>responsive</em> testing.)</li>
<li><strong>Network</strong> — WiFi, 5G/4G/3G, low bandwidth, high latency, VPN/proxy, captive portals.</li>
<li><strong>Database</strong> — different DB engines or versions the product is certified against.</li>
<li><strong>Software / third-party</strong> — coexistence with antivirus, ad blockers, password managers, browser extensions, other apps competing for resources.</li>
<li><strong>Versions / data</strong> — app upgrade paths, data migration, API contract versioning between client and server.</li>
<li><strong>Localisation</strong> — languages, character sets, right-to-left layouts, date/number/currency formats, time zones.</li>
<li><strong>Accessibility tooling</strong> — behaves correctly with screen readers, magnification and OS font scaling.</li>
</ul>
<p>Practical points to add: you can't test every combination, so you build a <strong>compatibility matrix</strong> from real analytics — the browsers/OS/devices your actual users have, prioritised by share — and cover the rest by risk. Device farms (BrowserStack, Sauce Labs, Firebase Test Lab) cover breadth; keep a few real devices for anything involving performance, gestures or network.</p>`,
    },
  ],
};
