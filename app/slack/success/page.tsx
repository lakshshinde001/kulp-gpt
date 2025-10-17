"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/userStore";

export default function SlackSuccessPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { login, initializeAuth } = useUserStore();

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');

        if (!userId) {
          setError('No user ID provided');
          setIsLoading(false);
          return;
        }

        // Fetch user data from API
        const response = await fetch(`/api/auth/user/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();

        // Store all user details in userStore with access token
        // The login method will generate an access token and set expiry for 1 day
        login({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          createdAt: data.user.createdAt,
          avatar: data.user.image, // map image to avatar
          slackId: data.user.slack_user_id || undefined,
          // Add any other fields from the user data
        });

        // Initialize auth to set up token validation
        initializeAuth();

        setIsLoading(false);

        setTimeout(() => {
          window.location.href = '/';
        }, 1000);

        // Redirect to home page
        // window.location.href = '/';

      } catch (err) {
        console.error('Authentication error:', err);
        setError('Failed to authenticate. Please try again.');
        setIsLoading(false);
      }
    };

    authenticateUser();
  }, [login]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="flex justify-center">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Authenticating...</h1>
            <p className="text-muted-foreground mt-2">
              Setting up your account...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-bold text-red-600">Authentication Failed</h1>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
          <Button onClick={() => window.location.href = '/login'} className="w-full">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <div>
          <h1 className="text-3xl font-bold">Success!</h1>
          <p className="text-muted-foreground mt-2">
            Your Slack account has been connected successfully.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    </div>
  );
}
