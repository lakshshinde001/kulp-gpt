"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useUserStore } from "@/stores/userStore";

export default function ProfilePage() {
  const { user, logout } = useUserStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Redirect will happen automatically due to middleware
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authorized</h1>
          <p className="text-muted-foreground mb-6">Please log in to view your profile.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-neutral-950 via-neutral-900 to-red-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your account settings</p>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <div className="text-lg font-medium">{user.name}</div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                <div className="text-lg font-medium">{user.email}</div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                <div className="text-lg font-medium">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                <div className="text-sm font-mono bg-muted px-3 py-2 rounded-md">{user.id}</div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Once you logout, you'll need to sign in again to access your account.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full sm:w-auto"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="mr-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
