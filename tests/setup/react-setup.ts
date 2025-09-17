/**
 * React Testing Setup
 *
 * Configures React Testing Library and Jest DOM matchers
 * for testing React components across the monorepo.
 */

import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with Jest DOM matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
