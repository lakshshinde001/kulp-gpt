"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useUserStore } from "@/stores/userStore";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login } = useUserStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Login successful
      console.log('Login successful:', data);

      // Store user data in userStore with access token (valid for 1 day)
      login({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        createdAt: data.user.createdAt,
        avatar: data.user.image, // map image to avatar
        // Add any other fields from the user data
      });

      // Redirect to dashboard after successful login
      window.location.href = '/';

    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: error instanceof Error ? error.message : "Login failed. Please check your credentials." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {errors.general && (
            <p className="text-sm text-destructive text-center">{errors.general}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = '/api/slack/oauth'}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 10.12a2.527 2.527 0 0 1 2.52 2.522 2.527 2.527 0 0 1-2.52 2.523zm4.313-2.523a2.527 2.527 0 0 1 2.521-2.522 2.527 2.527 0 0 1 2.521 2.522A2.528 2.528 0 0 1 12.896 15.165 2.528 2.528 0 0 1 10.375 12.642zm2.521 4.313a2.528 2.528 0 0 1 2.523-2.52 2.528 2.528 0 0 1 2.523 2.52A2.528 2.528 0 0 1 15.419 19.475a2.528 2.528 0 0 1-2.523-2.52zm4.313 2.523a2.528 2.528 0 0 1 2.523-2.52 2.528 2.528 0 0 1 2.523 2.52A2.528 2.528 0 0 1 19.732 21.988a2.528 2.528 0 0 1-2.523-2.52zm-4.313-9.434a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 12.896 3.75a2.528 2.528 0 0 1 2.52 2.523 2.528 2.528 0 0 1-2.52 2.523zm4.313-2.523A2.528 2.528 0 0 1 19.732 3.75a2.528 2.528 0 0 1 2.523 2.523A2.528 2.528 0 0 1 19.732 8.796a2.528 2.528 0 0 1-2.523-2.523z"/>
          </svg>
          Continue with Slack
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
