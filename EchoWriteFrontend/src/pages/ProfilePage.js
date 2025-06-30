// frontend/src/pages/ProfilePage.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom"; // To read callback status
import axiosInstance from "../api/apiConfig";

const API_URL = process.env.REACT_APP_API_URL;

const ProfilePage = () => {
  const {
    user: authUser,
    loading: authLoading,
    logout,
    auth,
    refreshUser,
  } = useAuth(); // Assuming AuthContext provides full user object or re-fetches
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    openAiApiKey: "",
    geminiApiKey: "",
    perplexityApiKey: "",
  });
  const [apiKeyStatus, setApiKeyStatus] = useState({
    openai: "Not Set",
    gemini: "Not Set",
    perplexity: "Not Set",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [twitterMessage, setTwitterMessage] = useState("");

  // Separate state for UI messages to avoid conflicts
  const [connectMessage, setConnectMessage] = useState('');
  const [connectError, setConnectError] = useState('');
//   const [profileUpdateMessage, setProfileUpdateMessage] = useState('');
//   const [profileUpdateError, setProfileUpdateError] = useState('');
const navigate = useNavigate(); // For cleaner URL updates
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Effect to handle OAuth callback status from URL parameters
  useEffect(() => {
    const status = searchParams.get("twitter_connect");
    const messageParam = searchParams.get("message");

    console.log(
      "ProfilePage useEffect for twitter_connect: status =",
      status,
      "messageParam =",
      messageParam
    ); // DEBUG

    if (status) {
      if (status === "success") {
        setConnectMessage(
          "Twitter account connected successfully! Profile refreshing..."
        );
        if (refreshUser) {
          console.log("Calling refreshUser due to twitter_connect=success"); // DEBUG
          refreshUser(); // This will update authUser in AuthContext
        }
      } else if (status === "error") {
        setConnectError(
          `Twitter connection failed: ${messageParam || "Unknown error."}`
        );
      }

      // Clean up URL params after processing to prevent re-triggering on refresh
      // Using navigate for cleaner URL update without full page reload if possible
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("twitter_connect");
      newSearchParams.delete("message");
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [searchParams, refreshUser, navigate]); // Removed setSearchParams, setMessage, setError as direct deps
  // navigate is stable, refreshUser should be stable from useCallback

  const handleConnectTwitter = async () => {
    console.log("Initiating Twitter connection...");
    setConnectMessage('');
    setConnectError('');
    try {
        // Step 1: Frontend asks backend to prepare the OAuth flow and get the Twitter URL
        // This axios call WILL include the JWT because axios is configured to do so.
        const response = await axiosInstance.get(`${API_URL}/connect/twitter/initiate`); // Changed endpoint name
        if (response.data.authUrl) {
            console.log("Received Twitter Auth URL from backend. Redirecting to Twitter:", response.data.authUrl);
            // Step 2: Frontend redirects the user to the URL provided by Twitter (via our backend)
            window.location.href = response.data.authUrl;
        } else {
            setConnectError("Could not get Twitter authorization URL from server.");
        }
    } catch (err) {
        console.error("Error initiating Twitter connection:", err);
        setConnectError(err.response?.data?.message || "Failed to initiate Twitter connection. Please try again.");
    }
};

  const handleDisconnectTwitter = async () => {
    if (!window.confirm("Are you sure you want to disconnect your Twitter account?")) return;
    setConnectMessage('');
    setConnectError('');
    try {
        await axiosInstance.post(`${API_URL}/connect/twitter/disconnect`);
        setConnectMessage('Twitter account disconnected successfully.');
        if (refreshUser) refreshUser(); // Refresh user to update hasTwitterOAuth flag
    } catch (err) {
        setConnectError(err.response?.data?.message || "Failed to disconnect Twitter.");
    }
};

  useEffect(() => {
    if (authUser) {
      setFormData((prev) => ({
        ...prev,
        username: authUser.username || "",
        email: authUser.email || "",
        openAiApiKey: "",
        geminiApiKey: "",
        perplexityApiKey: "", // Always clear input fields
        // DO NOT prefill API key from user object if it were ever sent to client
      }));
      setApiKeyStatus({
        openai: authUser.hasOpenAiApiKey ? "Configured" : "Not Set",
        gemini: authUser.hasGeminiApiKey ? "Configured" : "Not Set",
        perplexity: authUser.hasPerplexityApiKey ? "Configured" : "Not Set",
      });
    }
  }, [authUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const payload = { username: formData.username, email: formData.email };
    if (formData.openAiApiKey) payload.openAiApiKey = formData.openAiApiKey;
    else if (formData.openAiApiKey === "") payload.openAiApiKey = "";

    if (formData.geminiApiKey) payload.geminiApiKey = formData.geminiApiKey;
    else if (formData.geminiApiKey === "") payload.geminiApiKey = "";

    if (formData.perplexityApiKey)
      payload.perplexityApiKey = formData.perplexityApiKey;
    else if (formData.perplexityApiKey === "") payload.perplexityApiKey = "";

    try {
      const response = await axiosInstance.put(`${API_URL}/auth/profile`, payload);
      setMessage("Profile updated successfully!");
      setApiKeyStatus({
        openai: response.data.hasOpenAiApiKey ? "Configured" : "Not Set",
        gemini: response.data.hasGeminiApiKey ? "Configured" : "Not Set",
        perplexity: response.data.hasPerplexityApiKey
          ? "Configured"
          : "Not Set",
      });
      setFormData((prev) => ({
        ...prev,
        openAiApiKey: "",
        geminiApiKey: "",
        perplexityApiKey: "",
      }));
      // Trigger user refresh in AuthContext (AuthContext should handle its own errors)
      if (auth && typeof auth.refreshUser === "function") {
        auth.refreshUser(); // Don't await here if you don't want its errors to block this flow
        // Or await and handle its specific errors separately.
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <p>Loading user profile...</p>;
  if (!authUser) return <p>Please log in to view your profile.</p>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-center mb-8">Your Profile</h1>
      {message && (
        <p className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {message}
        </p>
      )}
      {error && (
        <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>
      )}

      {/* Display connection messages */}
      {connectMessage && <p className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{connectMessage}</p>}
            {connectError && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{connectError}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="username"
          >
            Username
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-3">
          API Key Configuration (BYOK)
        </h2>
        <p className="text-xs text-gray-600 mb-4">
          Your API keys are stored encrypted. Enter a new key to update or
          replace an existing one. Leave blank to keep the current key (if set).
          To remove a key, submit an empty field (this feature might require
          specific backend handling if "empty string" isn't desired for
          clearing).
        </p>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="openAiApiKey"
          >
            OpenAI API Key (Status:{" "}
            <span
              className={`font-semibold ${
                apiKeyStatus.openai === "Configured"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {apiKeyStatus.openai}
            </span>
            )
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            id="openAiApiKey"
            name="openAiApiKey"
            type="password"
            placeholder={
              apiKeyStatus.openai === "Configured"
                ? "Enter new key to change"
                : "Enter your OpenAI API Key"
            }
            value={formData.openAiApiKey}
            onChange={handleChange}
          />
          <p className="text-xs text-gray-500 mt-1">
            e.g., sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
          </p>
        </div>
        {/* Add fields for other API keys (Cohere, etc.) similarly */}
        {/* Gemini API Key Input */}
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="geminiApiKey"
          >
            Google AI Studio (Gemini) API Key (Status:{" "}
            <span
              className={`font-semibold ${
                apiKeyStatus.gemini === "Configured"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {apiKeyStatus.gemini}
            </span>
            )
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            id="geminiApiKey"
            name="geminiApiKey"
            type="password"
            placeholder={
              apiKeyStatus.gemini === "Configured"
                ? "Enter new key to change"
                : "Enter your Gemini API Key"
            }
            value={formData.geminiApiKey}
            onChange={handleChange}
          />
        </div>

        {/* Perplexity API Key Input */}
        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="perplexityApiKey"
          >
            Perplexity API Key (Status:{" "}
            <span
              className={`font-semibold ${
                apiKeyStatus.perplexity === "Configured"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {apiKeyStatus.perplexity}
            </span>
            )
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            id="perplexityApiKey"
            name="perplexityApiKey"
            type="password"
            placeholder={
              apiKeyStatus.perplexity === "Configured"
                ? "Enter new key to change"
                : "Enter your Perplexity API Key"
            }
            value={formData.perplexityApiKey}
            onChange={handleChange}
          />
        </div>

        <button
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-6"
          type="submit"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>

      <hr className="my-6" />
      <h2 className="text-xl font-semibold mb-3">Connected Accounts</h2>

      {/* Twitter Connect/Disconnect */}
      <div className="mb-4 p-3 border rounded-md">
        <p className="text-sm font-medium">Twitter (X)</p>
        {authUser?.hasTwitterOAuth ? ( // <<<< NEED TO ADD hasTwitterOAuth to /me response
          <div className="mt-2">
            <p className="text-sm text-green-600">Status: Connected.</p>
            <button
              onClick={handleDisconnectTwitter}
              className="mt-1 text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-gray-500">Status: Not Connected.</p>
            <button
              onClick={handleConnectTwitter}
              className="mt-1 text-sm bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-3 rounded"
            >
              Connect Twitter Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
