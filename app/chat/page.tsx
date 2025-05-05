"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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

const ChatPage = () => {
  const [session, setSession] = useState<HelpSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [customRecap, setCustomRecap] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id");

  // Initial fetch
  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    // Initial fetch
    fetchSession(true);

    // Set up polling interval (every 3 seconds)
    const intervalId = setInterval(() => {
      fetchSession();
    }, 3000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [sessionId, router]);

  // Function to fetch session data
  const fetchSession = async (isInitialLoad = false) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data) return;

      // On initial load, set the session
      if (isInitialLoad) {
        setSession(data);
        setLoading(false);

        // Scroll to bottom once on initial load
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      } else if (session) {
        // For subsequent polls, just update the data
        setSession(data);
      }
    } catch (err) {
      console.error("Error fetching session:", err);
      if (!session) {
        setError("Failed to load session");
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !sessionId) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          helpSessionId: sessionId,
          content: newMessage,
          isAdmin: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Clear input before fetching updated session
      setNewMessage("");

      // Refresh session data immediately after sending a message
      await fetchSession();
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !sessionId) return;

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingImage(true);
    setUploadProgress(10); // Start progress

    try {
      // Upload the image
      const uploadResponse = await fetch("/api/admin/uploadImage", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      setUploadProgress(70); // Update progress

      const { url } = await uploadResponse.json();

      // Format the image URL in the format that's displayed in the chat
      const imageContent = `[Image: ${url}]`;

      // Send the image URL as a message
      const messageResponse = await fetch(`/api/admin/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          helpSessionId: sessionId,
          content: imageContent,
          isAdmin: true,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error("Failed to send image message");
      }

      setUploadProgress(100); // Complete progress

      // Refresh session data to include new message
      await fetchSession();
    } catch (err) {
      console.error("Error handling image:", err);
      setError("Failed to upload and send image");
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCloseSession = async () => {
    if (!sessionId) return;

    setIsClosingSession(true);

    try {
      const response = await fetch("/api/admin/closeSession", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          helpSessionId: sessionId,
          customRecap: customRecap.trim() || undefined, // Only send if there's a value
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to close session");
      }

      // Refresh session data to show completed status
      await fetchSession();

      // Hide the modal
      setShowCloseModal(false);
    } catch (err) {
      console.error("Error closing session:", err);
      setError("Failed to close session");
    } finally {
      setIsClosingSession(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Function to render message content with potential images
  const renderMessageContent = (content: string) => {
    // Check if the content contains an image link in Markdown format: ![Image](url)
    const markdownImageMatch = content.match(
      /!\[Image\]\((https:\/\/[^\s)]+)\)/
    );

    // Check if the content contains an image link in bracket format: [Image: url]
    const bracketImageMatch = content.match(/\[Image: (https:\/\/[^\s\]]+)\]/);

    if (markdownImageMatch && markdownImageMatch[1]) {
      const imageUrl = markdownImageMatch[1];
      return (
        <div>
          <div className="mb-2">
            <img
              src={imageUrl}
              alt="Shared image"
              className="max-w-full rounded-lg max-h-80 object-contain"
            />
          </div>
          <div>{content.replace(/!\[Image\]\((https:\/\/[^\s)]+)\)/, "")}</div>
        </div>
      );
    } else if (bracketImageMatch && bracketImageMatch[1]) {
      const imageUrl = bracketImageMatch[1];
      return (
        <div>
          <div className="mb-2">
            <img
              src={imageUrl}
              alt="Shared image"
              className="max-w-full rounded-lg max-h-80 object-contain"
            />
          </div>
          <div>
            {content.replace(
              /\[Image: (https:\/\/[^\s\]]+)\]/,
              "Image attachment"
            )}
          </div>
        </div>
      );
    }

    return <div className="whitespace-pre-wrap">{content}</div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF9F4]">
        <div className="text-xl text-[#2D3E50]">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDF9F4]">
        <div className="text-xl text-[#2D3E50] mb-4">Session not found</div>
        <Link href="/" className="text-[#2D3E50] underline">
          Return to dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col">
      <header className="bg-white shadow py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="flex items-center gap-2">
                <Image
                  src="/icon.png"
                  alt="Eldrix.app logo"
                  width={36}
                  height={36}
                  priority
                />
                <span className="font-bold text-[#2D3E50]">Admin</span>
              </div>
            </Link>
            <div className="h-6 border-r border-gray-300"></div>
            <div>
              <h1 className="text-xl font-semibold text-[#2D3E50]">
                {session.title || `Session ${session.id.slice(0, 8)}`}
              </h1>
              <div className="text-sm text-gray-500">
                User: {session.userId} | Status:{" "}
                {session.completed ? "Completed" : session.status}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!session.completed && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Close Session
              </button>
            )}
            <Link href="/">
              <button className="px-4 py-2 text-[#2D3E50] border border-[#2D3E50] rounded-lg hover:bg-[#F0F5FA] transition">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full p-4 flex flex-col">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg flex-1 flex flex-col overflow-hidden w-full">
          <div className="p-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              Created: {formatDate(session.createdAt)}
            </div>
            {session.type && (
              <div className="text-sm text-gray-600">Type: {session.type}</div>
            )}
          </div>

          <div
            ref={messagesContainerRef}
            className="h-[375px] overflow-y-auto p-4 space-y-4"
          >
            {session.messages.length === 0 ? (
              <div className="text-center text-gray-500 my-8">
                No messages in this session yet.
              </div>
            ) : (
              session.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isAdmin ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.isAdmin
                        ? "bg-[#2D3E50] text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="text-sm mb-1">
                      {message.isAdmin ? "Admin" : "User"} •{" "}
                      {formatDate(message.createdAt)}
                    </div>
                    {renderMessageContent(message.content)}
                  </div>
                </div>
              ))
            )}
          </div>

          {!session.completed && (
            <form
              onSubmit={handleSubmit}
              className="border-t border-gray-200 p-4 bg-gray-50"
            >
              <div className="flex flex-col gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={submitting || isUploadingImage}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50] min-h-[80px] resize-none"
                ></textarea>

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      disabled={submitting || isUploadingImage}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg cursor-pointer ${
                        isUploadingImage
                          ? "bg-gray-200 text-gray-500"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {isUploadingImage ? "Uploading..." : "Attach Image"}
                    </label>

                    {isUploadingImage && (
                      <div className="ml-3 w-32 bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      submitting || isUploadingImage || !newMessage.trim()
                    }
                    className="bg-[#2D3E50] text-white px-4 py-2 rounded-lg hover:bg-[#24466d] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Close Session Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-[#2D3E50] mb-4">
              Close Help Session
            </h2>
            <p className="text-gray-600 mb-4">
              This will mark the session as completed and no further messages
              can be sent. You can optionally provide a custom session recap.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Recap (Optional)
              </label>
              <textarea
                value={customRecap}
                onChange={(e) => setCustomRecap(e.target.value)}
                placeholder="Provide a custom recap or leave empty to generate automatically"
                className="w-full border border-gray-300 rounded-md p-2 min-h-[100px]"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                If left empty, a recap will be generated automatically using AI.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseSession}
                disabled={isClosingSession}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isClosingSession ? "Closing..." : "Close Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ChatPage;
