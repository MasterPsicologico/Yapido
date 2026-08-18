'use client';

import { AuthFlow } from '@/components/auth/AuthFlow';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background">
      <AuthFlow />
    </div>
  );
}