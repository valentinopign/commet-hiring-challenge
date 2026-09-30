"use client";

import { createContext, type RefObject } from "react";

/**
 * `true` once the current step has finished mounting. Content that appears because of a choice
 * animates in; content that is simply there when the step opens does not, since the step's own
 * entrance already covers it. Outside a step, everything counts as settled.
 */
export const StepSettledContext = createContext<RefObject<boolean>>({ current: true });
