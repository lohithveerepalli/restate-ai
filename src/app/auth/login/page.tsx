"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/stores/studio-store";
import { LandingPage } from "@/components/landing/landing-page";

export default function LoginPage() {
  const setShowAuthModal = useStudioStore((s) => s.setShowAuthModal);

  useEffect(() => {
    setShowAuthModal(true, "login");
  }, [setShowAuthModal]);

  return <LandingPage />;
}
