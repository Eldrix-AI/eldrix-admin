"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  helpSessionId: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
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

const Dashboard = () => {
  const [sessions, setSessions] = useState<HelpSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Fetch sessions from API
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/admin/sessions");

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push("/login");
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setSessions(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load sessions");
        setLoading(false);
        console.error(err);
      }
    };

    fetchSessions();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Filter active/pending sessions by status
  const openSessions = sessions.filter(
    (session) => !session.completed && session.status === "open"
  );
  const pendingSessions = sessions.filter(
    (session) => !session.completed && session.status === "pending"
  );

  // Filter completed sessions
  const completedSessions = sessions.filter((session) => session.completed);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF9F4]">
        <div className="text-xl text-[#2D3E50]">Loading sessions...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF9F4] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Image
              src="/icon.png"
              alt="Eldrix.app logo"
              width={48}
              height={48}
              priority
            />
            <h1 className="text-3xl font-extrabold text-[#2D3E50]">
              Eldrix Admin Dashboard
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-[#2D3E50] text-white rounded-lg hover:bg-[#24466d] transition"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Open Sessions - Blue and at the top */}
        {openSessions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2D3E50] mb-4">
              Open Sessions ({openSessions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openSessions.map((session) => (
                <Link href={`/chat?id=${session.id}`} key={session.id}>
                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition cursor-pointer border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">
                        {session.title || `Session ${session.id.slice(0, 8)}`}
                      </h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {session.status}
                      </span>
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      User: {session.userId}
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      Type: {session.type || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Last updated: {formatDate(session.updatedAt)}
                    </div>
                    <div className="mt-3 text-sm font-medium text-blue-600">
                      {session.messages.length} messages
                    </div>
                    {session.lastMessage && (
                      <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                        Last message: {session.lastMessage}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Pending Sessions - Yellow and in the middle */}
        {pendingSessions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2D3E50] mb-4">
              Pending Sessions ({pendingSessions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingSessions.map((session) => (
                <Link href={`/chat?id=${session.id}`} key={session.id}>
                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition cursor-pointer border-l-4 border-[#2D3E50]">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">
                        {session.title || `Session ${session.id.slice(0, 8)}`}
                      </h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        {session.status}
                      </span>
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      User: {session.userId}
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      Type: {session.type || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Last updated: {formatDate(session.updatedAt)}
                    </div>
                    <div className="mt-3 text-sm font-medium text-[#2D3E50]">
                      {session.messages.length} messages
                    </div>
                    {session.lastMessage && (
                      <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                        Last message: {session.lastMessage}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Completed Sessions - Green and at the bottom */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-[#2D3E50] mb-4">
            Completed Sessions ({completedSessions.length})
          </h2>
          {completedSessions.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-[#5A7897]">
              No completed sessions found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedSessions.map((session) => (
                <Link href={`/chat?id=${session.id}`} key={session.id}>
                  <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition cursor-pointer border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">
                        {session.title || `Session ${session.id.slice(0, 8)}`}
                      </h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      User: {session.userId}
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      Type: {session.type || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Completed on: {formatDate(session.updatedAt)}
                    </div>
                    <div className="mt-3 text-sm font-medium text-[#2D3E50]">
                      {session.messages.length} messages
                    </div>
                    {session.sessionRecap && (
                      <div className="mt-2 text-sm text-gray-700">
                        Recap: {session.sessionRecap}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
