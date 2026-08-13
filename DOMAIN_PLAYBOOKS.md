# Domain Playbooks — Reference Appendix

Only **one** domain playbook becomes in-app Qs — the one matching your
actual target role. The other two are held here as a reference outline.
Promote one into the app when the target role shifts.

---

## How to pick the one in-app domain

Answer this honestly before authoring Chunk 3:

> *"Which domain comes up in 70%+ of the job postings I'm actually
> applying to?"*

The answer is your in-app domain. The other two stay in this file as
20-bullet outlines, not full Qs.

---

## Domain A — Payments + E-commerce

Target companies: Stripe, Adyen, Klarna, Mollie, Revolut, Wise, Zalando,
eMAG, Shopify, Bolt-Food/Glovo payments.

Likely in-app Qs (12 if Domain A is selected):

1. What's different about testing money? — idempotency, exact decimals,
   fraud signals, PCI scope.
2. 3DS / SCA flows — testing the redirect dance + EU regulation.
3. Refund + chargeback + reversal — the three states people confuse.
4. Payment-method matrix (cards / wallets / SEPA / BNPL) — why one card
   smoke isn't enough.
5. Settlement vs authorization — the bug class that ships every year.
6. Cart + inventory race conditions — two users, one item.
7. Pricing / promo / coupon interactions — multi-promo stacking
   decision table.
8. Search relevance — synonyms, typos, locale.
9. International taxes & currencies — rounding + tax-inclusive display.
10. GDPR data deletion across order history — what stays, what goes.
11. Subscription billing — proration, dunning, grace periods.
12. Marketplace split payments — escrow, payouts, reconciliation.

---

## Domain B — Healthcare + Medical Devices

Target companies: Roche, Siemens Healthineers, Philips Health, Babylon,
Doctolib, Veeva, Cerner, smaller medical-devices firms.

Outline (only authored as in-app Qs if Domain B is selected):

1. IEC 62304 software classification (Class A/B/C) and what changes for
   QA evidence.
2. ISO 13485 quality system — records, audit trails, immutability.
3. HIPAA / GDPR-Health — synthetic data, masking, audit logs. Never use
   real PHI.
4. Safety alarms — "do no harm" assertions; chaos test alarms under DB
   failure.
5. EHR / FHIR API testing — HL7 schema validation, profile-required
   fields, version compat.
6. Medical devices: hardware-in-the-loop testing — sensor noise, real
   timing, fail-safe states. When emulators lie.
7. Clinical decision support — testing without practising medicine.
8. Healthcare release cycles — validation runs, formal approval gates,
   no "hotfix to prod".

---

## Domain C — Logistics + Automotive Safety

Target companies: DHL, FedEx, Maersk, Cargus, Continental, Bosch,
Stellantis, Plus.

Outline (only authored as in-app Qs if Domain C is selected):

1. Route optimisation — the oracle problem. Property-based testing.
2. Time-zone bugs at scale — DST, pickup vs delivery windows,
   cross-border.
3. Tracking / event sourcing — out-of-order events, late arrivals,
   replays.
4. Warehouse barcode / RFID scan testing — misreads, duplicates,
   scanner offline.
5. Last-mile delivery — no signal, address wrong, graceful degradation.
6. ISO 26262 — ASIL ratings and how QA maps to them. V-model in safety
   context.
7. HIL vs SIL (hardware-in-the-loop vs software-in-the-loop) — where
   each finds bugs, cost trade-off.
8. AUTOSAR / SOME-IP — why a web-stack mindset doesn't transfer.

---

## When to promote a domain into the app

A domain moves from this appendix into a real in-app chunk when:

1. You've interviewed in the domain at least twice and felt
   under-prepared.
2. You've accepted a role in the domain.
3. You're pivoting your job search to the domain explicitly.

Until one of those triggers, keep the chunk in this file as an outline.
Don't pre-author it just because the domain is interesting.
