// // frontend/src/contexts/AuthContext.js
// import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // Added useCallback
// import axios from 'axios';
// import axiosInstance from '../api/apiConfig';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);

//     const API_URL = process.env.REACT_APP_API_URL;

//     const fetchFullUserProfile = useCallback(async (tokenToUse) => { // useCallback here
//         if (!tokenToUse) {
//             setUser(null);
//             setLoading(false);
//             return null;
//         }
//         setLoading(true); // Indicate loading when fetching profile
//         try {
//             axios.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
//             const profileRes = await axiosInstance.get(`${API_URL}/auth/me`);
//             setUser(profileRes.data); // This user object will now have hasTwitterOAuth
//             console.log("AuthContext: User profile fetched/updated", profileRes.data);
//             return profileRes.data;
//         } catch (err) {
//             console.error("AuthContext: Failed to fetch full user profile:", err);
//             localStorage.removeItem('echowrite-token');
//             delete axios.defaults.headers.common['Authorization'];
//             setUser(null);
//             // Don't re-throw here unless login/register needs to catch it specifically
//         } finally {
//             setLoading(false);
//         }
//     }, [API_URL]); // API_URL is a stable dependency

//     useEffect(() => {
//         const token = localStorage.getItem('echowrite-token');
//         if (token) {
//             fetchFullUserProfile(token);
//         } else {
//             setLoading(false); // No token, not loading
//         }
//     }, [fetchFullUserProfile]); // Run on mount and if fetchFullUserProfile changes (it won't due to useCallback)


//     const login = async (email, password) => {
//         // ... (axios.post to /login) ...
//         const response = await axiosInstance.post(`${API_URL}/auth/login`, { email, password });
//         const token = response.data.token;
//         localStorage.setItem('echowrite-token', token);
//         await fetchFullUserProfile(token); // Fetch full profile with hasTwitterOAuth
//         return response.data; // Or return the user object from fetchFullUserProfile
//     };

//     const register = async (username, email, password) => {

//         // ... (axios.post to /register) ...
//         console.log('AuthContext: Starting registration');
//         const response = await axiosInstance.post(`${API_URL}/auth/register`, { username, email, password });
//         const token = response.data.token;
//         localStorage.setItem('echowrite-token', token);
//         await fetchFullUserProfile(token); // Fetch full profile
//         return response.data;
//         console.log('AuthContext: Registration successful, updating user state');
//         console.log('AuthContext: User state updated', user);

//     };

//     const logout = useCallback(() => {
//         localStorage.removeItem('echowrite-token');
//         delete axios.defaults.headers.common['Authorization'];
//         setUser(null);
//     });

//     // Add a function to refresh user data, e.g., after profile update
//     // This is the function ProfilePage will call
//     const refreshUser = useCallback(async () => {
//         console.log("AuthContext: refreshUser called");
//         const token = localStorage.getItem('echowrite-token');
//         if (token) {
//             await fetchFullUserProfile(token);
//         }
//     }, [fetchFullUserProfile]);

//     return (
//         <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, fetchFullUserProfile }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => useContext(AuthContext);

// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import axiosInstance from '../api/apiConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchFullUserProfile = useCallback(async (tokenToUse) => {
        if (!tokenToUse) {
            setUser(null);
            setLoading(false);
            return null;
        }
        setLoading(true);
        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${tokenToUse}`;
            const profileRes = await axiosInstance.get(`${API_URL}/auth/me`);
            setUser(profileRes.data);
            console.log("AuthContext: User profile fetched/updated", profileRes.data);
            return profileRes.data;
        } catch (err) {
            console.error("AuthContext: Failed to fetch full user profile:", err);
            localStorage.removeItem('echowrite-token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
            throw err; // Re-throw so register/login can handle it
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        const token = localStorage.getItem('echowrite-token');
        if (token) {
            fetchFullUserProfile(token);
        } else {
            setLoading(false);
        }
    }, [fetchFullUserProfile]);

    const login = async (email, password) => {
        const response = await axiosInstance.post(`${API_URL}/auth/login`, { email, password });
        const token = response.data.token;
        localStorage.setItem('echowrite-token', token);
        const userProfile = await fetchFullUserProfile(token);
        return { ...response.data, user: userProfile };
    };

    const register = async (username, email, password) => {
        console.log('AuthContext: Starting registration');
        const response = await axiosInstance.post(`${API_URL}/auth/register`, { username, email, password });
        const token = response.data.token;
        localStorage.setItem('echowrite-token', token);
        
        // Wait for user profile to be fetched and state updated
        const userProfile = await fetchFullUserProfile(token);
        console.log('AuthContext: Registration successful, user data:', userProfile);
        
        // Return the complete user profile along with response data
        return { ...response.data, user: userProfile };
    };

    const logout = useCallback(() => {
        localStorage.removeItem('echowrite-token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    }, []); // Added missing dependency array

    const refreshUser = useCallback(async () => {
        console.log("AuthContext: refreshUser called");
        const token = localStorage.getItem('echowrite-token');
        if (token) {
            await fetchFullUserProfile(token);
        }
    }, [fetchFullUserProfile]);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, fetchFullUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);