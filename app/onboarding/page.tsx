import type { Metadata } from "next";
import { OnboardingIntro } from "@/components/onboarding/onboarding-intro";

export const metadata: Metadata = { title: "Welcome · Commet" };

export default function OnboardingPage() {
  return <OnboardingIntro />;
}
