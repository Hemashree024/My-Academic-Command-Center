"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookOpenCheck } from 'lucide-react'; // Using an icon

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
      description: `Welcome back, ${name.trim()}! Redirecting to dashboard...`,
    });

    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-xl border border-border/50 overflow-hidden">
        <CardHeader className="text-center p-8 bg-gradient-to-b from-card to-secondary/10 border-b">
           <div className="flex justify-center items-center mb-4">
              <BookOpenCheck className="h-12 w-12 text-primary" />
           </div>
          <CardTitle className="text-3xl font-bold text-primary tracking-tight">Welcome to NextUp</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">Your Academic Command Center</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 h-11 text-base" // Slightly larger input
              />
               <p className="text-xs text-muted-foreground pt-1">Please enter your name to access your dashboard.</p>
            </div>
          </CardContent>
          <CardFooter className="bg-secondary/20 p-6 border-t">
            <Button type="submit" className="w-full h-11 text-lg">
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
