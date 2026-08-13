import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/* Testing Library only auto-registers this when Vitest globals are on. We keep
   globals off (explicit imports), so unmount between tests by hand — otherwise
   renders accumulate in the same document and queries find duplicates. */
afterEach(cleanup);
