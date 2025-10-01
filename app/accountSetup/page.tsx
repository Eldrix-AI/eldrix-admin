"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

const AccountSetupContent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get email and password from URL parameters
    const emailParam = searchParams.get("email");
    const passwordParam = searchParams.get("password");

    if (emailParam) setEmail(emailParam);
    if (passwordParam) setPassword(passwordParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Setup failed");
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error("Setup error:", err);
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FDF9F4] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Image
              src="/icon.png"
              alt="Eldrix.app logo"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-[#2D3E50] mb-4">
            Account Setup Complete!
          </h1>
          <p className="text-gray-600 mb-6">
            Your account has been successfully set up. You can now log in to
            access Eldrix.
          </p>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Redirecting to login page...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F4] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Image
            src="/icon.png"
            alt="Eldrix.app logo"
            width={80}
            height={80}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-[#2D3E50]">
            Complete Your Account Setup
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome to Eldrix! Please confirm your details to complete your
            account setup.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50] focus:border-transparent"
              placeholder="Enter your email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50] focus:border-transparent"
              placeholder="Enter your password"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This password was provided in your setup link for easy access.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2D3E50] text-white py-3 px-4 rounded-lg hover:bg-[#24466d] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up account..." : "Complete Setup"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{" "}
            <a
              href="mailto:davidfales@eldrix.ai"
              className="text-[#2D3E50] hover:underline"
            >
              davidfales@eldrix.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

const AccountSetup = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <AccountSetupContent />
    </Suspense>
  );
};

export default AccountSetup;
