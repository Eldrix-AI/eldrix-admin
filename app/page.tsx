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

const Dashboard = () => {
  const [sessions, setSessions] = useState<HelpSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState<string | null>(
    null
  );
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    tempPassword: "",
  });
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

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if unauthorized
            router.push("/login");
            return;
          }
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setUsers(data);
        setUsersLoading(false);
      } catch (err) {
        console.error("Failed to load users:", err);
        setUsersLoading(false);
      }
    };

    fetchUsers();
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.phone.trim() ||
      !newUser.tempPassword.trim()
    ) {
      setError("Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setCreateUserLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (
          response.status === 400 &&
          errorData.message?.includes("already exists")
        ) {
          setError(
            `Email already exists: ${newUser.email}. Please use a different email address.`
          );
          return;
        }
        throw new Error(errorData.message || "Failed to create user");
      }

      const result = await response.json();

      // Reset form and close modal
      setNewUser({ name: "", email: "", phone: "", tempPassword: "" });
      setShowCreateUserModal(false);

      // Refresh users list
      const usersResponse = await fetch("/api/admin/users");
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Show success message with actual status
      const emailStatus = result.notifications?.emailSent ? "✅" : "❌";
      const smsStatus = result.notifications?.smsSent ? "✅" : "❌";
      alert(
        `User created successfully!\n\nEmail ${emailStatus} sent to ${newUser.email}\nSMS ${smsStatus} sent to ${newUser.phone}\n\nSetup link: ${result.notifications?.setupLink}`
      );
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreateUserLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${userName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeleteUserLoading(userId);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      // Refresh users list
      const usersResponse = await fetch("/api/admin/users");
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      alert(`User "${userName}" has been deleted successfully.`);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleteUserLoading(null);
    }
  };

  // Filter active/pending/ongoing sessions by status and sort by priority
  const openSessions = sessions
    .filter((session) => !session.completed && session.status === "open")
    .sort((a, b) => {
      // High priority first, then by updatedAt
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  const pendingSessions = sessions
    .filter((session) => !session.completed && session.status === "pending")
    .sort((a, b) => {
      // High priority first, then by updatedAt
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  const ongoingSessions = sessions
    .filter((session) => !session.completed && session.status === "ongoing")
    .sort((a, b) => {
      // High priority first, then by updatedAt
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  // Filter completed sessions
  const completedSessions = sessions.filter((session) => session.completed);

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!userFilter) return true;
    const searchTerm = userFilter.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchTerm) ||
      user.phone?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm)
    );
  });

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Create New User
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#2D3E50] text-white rounded-lg hover:bg-[#24466d] transition"
            >
              Logout
            </button>
          </div>
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
                  <div
                    className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition cursor-pointer border-l-4 ${
                      session.priority === "high"
                        ? "border-red-500 bg-red-50 shadow-red-200"
                        : "border-blue-500"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3
                        className={`text-xl font-semibold mb-2 ${
                          session.priority === "high"
                            ? "text-red-800"
                            : "text-[#2D3E50]"
                        }`}
                      >
                        {session.title || `Session ${session.id.slice(0, 8)}`}
                      </h3>
                      <div className="flex flex-col gap-1">
                        {session.priority === "high" && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-bold animate-pulse">
                            HIGH PRIORITY
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            session.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
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
                    <div
                      className={`mt-3 text-sm font-medium ${
                        session.priority === "high"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
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
                  <div
                    className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition cursor-pointer border-l-4 ${
                      session.priority === "high"
                        ? "border-red-500 bg-red-50 shadow-red-200"
                        : "border-[#2D3E50]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3
                        className={`text-xl font-semibold mb-2 ${
                          session.priority === "high"
                            ? "text-red-800"
                            : "text-[#2D3E50]"
                        }`}
                      >
                        {session.title || `Session ${session.id.slice(0, 8)}`}
                      </h3>
                      <div className="flex flex-col gap-1">
                        {session.priority === "high" && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-bold animate-pulse">
                            HIGH PRIORITY
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            session.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
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
                    <div
                      className={`mt-3 text-sm font-medium ${
                        session.priority === "high"
                          ? "text-red-600"
                          : "text-[#2D3E50]"
                      }`}
                    >
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

        {/* Ongoing Sessions - Purple section */}
        {ongoingSessions.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2D3E50] mb-4">
              Ongoing Sessions ({ongoingSessions.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ongoingSessions.map((session) => (
                <Link href={`/chat?id=${session.id}`} key={session.id}>
                  <div
                    className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition cursor-pointer border-l-4 ${
                      session.priority === "high"
                        ? "border-red-500 bg-red-50 shadow-red-200"
                        : "border-purple-500"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3
                        className={`text-xl font-semibold mb-2 ${
                          session.priority === "high"
                            ? "text-red-800"
                            : "text-[#2D3E50]"
                        }`}
                      >
                        {session.title || `Session ${session.id.slice(0, 8)}`}
                      </h3>
                      <div className="flex flex-col gap-1">
                        {session.priority === "high" && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-bold animate-pulse">
                            HIGH PRIORITY
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            session.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
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
                    <div
                      className={`mt-3 text-sm font-medium ${
                        session.priority === "high"
                          ? "text-red-600"
                          : "text-[#2D3E50]"
                      }`}
                    >
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

        {/* Users Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#2D3E50]">
              All Users ({users.length})
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filter by name, phone, or email..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D3E50] focus:border-transparent"
              />
            </div>
          </div>

          {usersLoading ? (
            <div className="bg-white p-6 rounded-lg shadow text-[#5A7897]">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-[#5A7897]">
              {userFilter
                ? "No users found matching your search."
                : "No users found."}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experience Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.imageUrl ? (
                                <Image
                                  src={user.imageUrl}
                                  alt={`${user.name}'s profile`}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  <span className="text-sm text-gray-600">
                                    {user.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              {user.age && (
                                <div className="text-sm text-gray-500">
                                  Age: {user.age}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.phone || "Not provided"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                            {user.experienceLevel || "Not specified"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/user/${user.id}`}
                              className="text-[#2D3E50] hover:text-[#24466d] transition"
                            >
                              View Profile
                            </Link>
                            <button
                              onClick={() =>
                                handleDeleteUser(user.id, user.name)
                              }
                              disabled={deleteUserLoading === user.id}
                              className="text-red-600 hover:text-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete user"
                            >
                              {deleteUserLoading === user.id ? (
                                <span className="text-xs">Deleting...</span>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-[#2D3E50] mb-4">
              Create New User
            </h2>
            <p className="text-gray-600 mb-4">
              Create a new user account. They will receive an email and SMS with
              setup instructions.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => {
                    setNewUser({ ...newUser, email: e.target.value });
                    if (error) setError(""); // Clear error when user starts typing
                  }}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temporary Password *
                </label>
                <input
                  type="text"
                  value={newUser.tempPassword}
                  onChange={(e) =>
                    setNewUser({ ...newUser, tempPassword: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]"
                  placeholder="Enter temporary password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be included in the setup link for easy access.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={createUserLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {createUserLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
