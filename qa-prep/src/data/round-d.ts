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
      answer: `<p class="say">Say this: group them. Six categories sound senior; twenty random ideas sound junior.</p>
<ul>
<li><strong>Functional</strong> — the features themselves: flows, rules, validation, navigation, login.</li>
<li><strong>Install and lifecycle</strong> — fresh install, <em>upgrade over an old version</em> (does the user's data survive?), uninstall, app killed in the background and reopened.</li>
<li><strong>Interruptions</strong> — incoming call, notification, alarm, screen lock, low battery. The classic mobile category.</li>
<li><strong>Network</strong> — WiFi, 4G, switching between them mid-request, offline behaviour, slow and flaky connections.</li>
<li><strong>Device and UI</strong> — screen sizes, rotation, the keyboard covering fields, gestures, touch target size, Android's back button, dark mode, big system fonts.</li>
<li><strong>Permissions</strong> — camera, location, notifications: granted, denied, and revoked later in settings.</li>
<li><strong>Non-functional</strong> — start-up time, battery and data use, app size, no sensitive data stored on the device, accessibility with TalkBack or VoiceOver.</li>
</ul>
<p>Mention tooling: real devices for anything about performance, gestures or network; emulators and device farms for breadth.</p>`,
    },
    {
      id: "d2",
      q: "You have a web application and a mobile application with the same core functionalities. What additional tests would you do on the mobile app?",
      diff: "mid",
      tags: ["mobile", "strategy"],
      answer: `<p class="say">Say this: "The business logic is shared, so I don't retest it from scratch. The extra effort goes to what the phone adds."</p>
<ul>
<li><strong>Interruptions</strong> — calls, notifications, the OS killing the app. No web equivalent.</li>
<li><strong>Install and upgrade</strong> — including upgrading over an old version with existing data.</li>
<li><strong>Offline and bad networks</strong> — mobile users lose signal constantly; web users mostly don't.</li>
<li><strong>Permissions and hardware</strong> — camera, location, biometrics, the Android back button, deep links, push notifications, the share sheet.</li>
<li><strong>Touch and layout</strong> — gestures, no hover state, small screens, rotation, the keyboard covering the field you're typing in.</li>
<li><strong>Fragmentation</strong> — many OS versions and devices, some of them slow.</li>
<li><strong>Old versions still in use</strong> — the one most candidates miss. On the web everyone gets the new version the moment you deploy. On mobile, people don't update, so an old app must still work against the current API, and force-update must work when it can't.</li>
</ul>
<p>Finish with the cross-checks: data created on mobile shows correctly on web, and the same account behaves the same on both.</p>`,
    },
    {
      id: "d3",
      q: "What tests would you write for a form with: first name, last name, gender (optional radio buttons), date of birth (hardcoded), address, and Save / Cancel buttons?",
      diff: "mid",
      tags: ["test-design"],
      answer: `<p class="say">Say this: go field by field, then the form as a whole.</p>
<ul>
<li><strong>Happy path</strong> — fill everything, Save, and check the data is really stored (in the database or API, not just on screen). Then fill only the required fields — gender is optional, so it must still save. Reopen and confirm the values come back.</li>
<li><strong>Names</strong> — empty, minimum and maximum length plus one either side, and a very long paste. Must accept O'Brien, Anne-Marie, van der Berg, and accents. Must handle digits, symbols and script payloads safely.</li>
<li><strong>Gender (radio)</strong> — nothing selected by default, saving without it works, only one option can be selected at a time, the choice comes back after reopening, and clicking the label works, not just the tiny circle.</li>
<li><strong>Date of birth (read-only)</strong> — the important one: it must be read-only <em>on the server too</em>. Change it in the request and the server must ignore or reject it. A field locked only in the UI is a security finding. Also check the format — 03/04 is ambiguous — and that the day doesn't shift by time zone.</li>
<li><strong>Address</strong> — long values, multi-line, special characters, postcode rules per country, and any autocomplete still allowing a manual entry.</li>
<li><strong>Buttons</strong> — Save disabled while submitting, double-click doesn't create two records, and the form keeps your data if the server errors. Cancel discards without saving and warns about unsaved changes instead of losing them silently.</li>
<li><strong>Form-level</strong> — Tab order, focus jumps to the first error, errors clear when fixed, and a session timeout mid-edit doesn't wipe everything without a word.</li>
</ul>
<p>Plus accessibility (labels, keyboard only, contrast) and the API check: send the request directly with missing or oversized fields and confirm the server validates on its own.</p>`,
    },
    {
      id: "d4",
      q: "What tests for that form should be performed if you open it on a mobile app?",
      diff: "mid",
      tags: ["mobile", "test-design"],
      answer: `<p class="say">Say this: "Everything from the web form, plus the phone layer."</p>
<ul>
<li><strong>Keyboard</strong> — the biggest source of real bugs here. It must not cover the field you're typing in; check the last fields and the Save button. Right keyboard type per field, "Next" moves in the right order, autocorrect doesn't mangle names.</li>
<li><strong>Rotation mid-entry</strong> — typed values, the radio choice and scroll position all survive. Losing input on rotate is a classic Android defect.</li>
<li><strong>Touch targets</strong> — radio buttons and Save/Cancel big enough and not crowded together.</li>
<li><strong>Interruptions</strong> — a call or notification mid-form, then back: the data is still there. App killed in the background: a draft is restored, or at least you're warned.</li>
<li><strong>Android back button</strong> — does it act like Cancel? Does it warn about unsaved changes, or silently throw them away?</li>
<li><strong>Network</strong> — Save with no signal gives a clear error and keeps your data. Save on a slow connection disables the button so you can't tap twice. Connection lost <em>during</em> the save: did it save or not? Check for a duplicate or a half-written record.</li>
<li><strong>Platform extras</strong> — paste from clipboard, native address autofill, voice input, TalkBack and VoiceOver, and iOS vs Android differences.</li>
</ul>`,
    },
    {
      id: "d5",
      q: "What are the types of compatibility testing?",
      diff: "mid",
      tags: ["theory", "compatibility"],
      answer: `<p class="say">Say this: "Two directions — backward and forward — then split by what varies."</p>
<ul>
<li><strong>Backward</strong> — the new version still works with older environments and older data. A new API still serving last year's mobile app.</li>
<li><strong>Forward</strong> — today's version keeps working on newer environments, like the next OS release. Tested against beta builds.</li>
<li><strong>Browser</strong> — Chrome, Safari, Firefox, Edge. Safari is usually the one that breaks.</li>
<li><strong>OS and device</strong> — Windows, macOS, Android and iOS versions, cheap phones as well as flagships, tablets, foldables.</li>
<li><strong>Screen</strong> — resolutions, pixel density, orientation, split screen. Often called responsive testing.</li>
<li><strong>Network, database, and other software</strong> — slow connections, VPNs, different DB versions, ad blockers and password managers.</li>
<li><strong>Versions and localisation</strong> — upgrade paths, data migration, languages, right-to-left layouts, date and currency formats, time zones.</li>
</ul>
<p><strong>The practical point:</strong> you can't test every combination. Build a matrix from real analytics — the browsers and devices your users actually have — and cover the rest by risk. Device farms give breadth; keep a few real devices for performance and gestures.</p>`,
    },
  ],
};
