'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('sarah.chen@netguard.ai');
  const [password, setPassword] = useState('demo1234');
  const [role, setRole] = useState<Role>('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    login(email, role);
    toast.success(`Welcome back! Signed in as ${role}`);
    router.push('/dashboard');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background bg-grid p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary glow-cyan">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">NetGuard AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">Network Attack Forecasting Platform</p>
        </div>

        {!showReset ? (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Sign in to your account</CardTitle>
              <CardDescription>
                Enter your credentials to access the security operations console
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@netguard.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowReset(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Demo Role</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Admin', 'Analyst'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition-all ${
                          role === r
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {role === 'Admin'
                      ? 'Full access: all pages, settings, alert resolution & deletion'
                      : 'Limited access: no settings, cannot resolve or delete alerts'}
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign in <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">Reset your password</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); toast.success('Password reset link sent to ' + email); setShowReset(false); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@netguard.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Send reset link</Button>
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  Back to sign in
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Demo authentication — no real credentials are stored. Dataset: IoT-SFC v2 (2026).
        </p>
      </div>
    </div>
  );
}
