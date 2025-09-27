"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  password: string;
  description: string | null;
  imageUrl: string | null;
  age: number | null;
  techUsage: string | null;
  accessibilityNeeds: string | null;
  preferredContactMethod: string;
  experienceLevel: string;
  emailList: boolean;
  smsConsent: boolean;
  notification: boolean;
  darkMode: boolean;
}

interface Message {
  id: string;
  helpSessionId: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
  read: boolean;
}

interface HelpSession {
  id: string;
  userId: string;
  title: string;
  sessionRecap: string | null;
  completed: boolean;
  lastMessage: string | null;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

const UserProfile = ({ params }: { params: { id: string } }) => {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<HelpSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Fetch user data from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${params.id}`);

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push("/login");
            return;
          }
          if (response.status === 404) {
            setError("User not found");
            setLoading(false);
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setUser(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load user profile");
        setLoading(false);
        console.error(err);
      }
    };

    fetchUser();
  }, [params.id, router]);

  // Fetch user conversations from API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(
          `/api/admin/users/${params.id}/conversations`
        );

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push("/login");
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setConversations(data);
        setConversationsLoading(false);
      } catch (err) {
        console.error("Failed to load conversations:", err);
        setConversationsLoading(false);
      }
    };

    fetchConversations();
  }, [params.id, router]);

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string, completed: boolean) => {
    if (completed) return "bg-green-100 text-green-800";
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "ongoing":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF9F4]">
        <div className="text-xl text-[#2D3E50]">Loading user profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF9F4] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-[#2D3E50] text-white rounded-lg hover:bg-[#24466d] transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF9F4] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            No user data available
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-[#2D3E50] text-white rounded-lg hover:bg-[#24466d] transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF9F4] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              ← Back
            </button>
            <Image
              src="/icon.png"
              alt="Eldrix.app logo"
              width={48}
              height={48}
              priority
            />
            <h1 className="text-3xl font-extrabold text-[#2D3E50]">
              User Profile
            </h1>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Profile Header */}
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={`${user.name}'s profile`}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-30 h-30 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-4xl text-gray-600">
                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-[#2D3E50] mb-2">
                {user.name}
              </h2>
              <p className="text-lg text-gray-600 mb-4">{user.email}</p>
              {user.description && (
                <p className="text-gray-700 mb-4">{user.description}</p>
              )}
            </div>
          </div>

          {/* User Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#2D3E50] border-b pb-2">
                Basic Information
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <p className="text-gray-900">
                    {user.phone || "Not provided"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <p className="text-gray-900">{user.age || "Not provided"}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Experience Level
                  </label>
                  <p className="text-gray-900 capitalize">
                    {user.experienceLevel || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Preferred Contact Method
                  </label>
                  <p className="text-gray-900 capitalize">
                    {user.preferredContactMethod || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-[#2D3E50] border-b pb-2">
                Technical Information
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tech Usage
                  </label>
                  <p className="text-gray-900">
                    {user.techUsage || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Accessibility Needs
                  </label>
                  <p className="text-gray-900">
                    {user.accessibilityNeeds || "None specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-[#2D3E50] border-b pb-2 mb-4">
              Preferences
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    user.emailList ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">Email List</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    user.smsConsent ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">SMS Consent</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    user.notification ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">Notifications</span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    user.darkMode ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">Dark Mode</span>
              </div>
            </div>
          </div>

          {/* User ID */}
          <div className="mt-8 pt-6 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User ID
              </label>
              <p className="text-sm text-gray-500 font-mono">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Conversations Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-[#2D3E50] mb-6">
            Past Conversations ({conversations.length})
          </h3>

          {conversationsLoading ? (
            <div className="text-center py-8 text-[#5A7897]">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-[#5A7897]">
              No conversations found for this user.
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <Link
                  href={`/chat?id=${conversation.id}`}
                  key={conversation.id}
                  className="block"
                >
                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-[#2D3E50] mb-2">
                          {conversation.title ||
                            `Session ${conversation.id.slice(0, 8)}`}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Type: {conversation.type || "N/A"}</span>
                          <span>Messages: {conversation.messages.length}</span>
                          <span>
                            Created: {formatDate(conversation.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(
                            conversation.status,
                            conversation.completed
                          )}`}
                        >
                          {conversation.completed
                            ? "Completed"
                            : conversation.status}
                        </span>
                        {conversation.priority && (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {conversation.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    {conversation.lastMessage && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          <strong>Last message:</strong>{" "}
                          {conversation.lastMessage}
                        </p>
                      </div>
                    )}

                    {conversation.sessionRecap && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          <strong>Session recap:</strong>{" "}
                          {conversation.sessionRecap}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Last updated: {formatDate(conversation.updatedAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default UserProfile;
