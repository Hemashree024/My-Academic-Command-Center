"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [name, setName] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Login Error",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    // Store name in localStorage (simple authentication)
    localStorage.setItem('loggedInUserName', name.trim());

    toast({
      title: "Login Successful",
      description: `Welcome back, ${name.trim()}!`,
    });

    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Welcome to NextUp</CardTitle>
          <CardDescription>Please enter your name to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
