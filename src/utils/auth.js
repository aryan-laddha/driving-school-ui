    // src/utils/auth.js

    // The import for jwtDecode is removed, as we will use the local decodeToken function.

    /**
     * Decodes a JWT token to extract the payload (e.g., role).
     * NOTE: This is client-side decoding and should NOT be used for security-sensitive decisions.
     * The backend should always validate the token. This is only for UI routing/display.
     * @param {string} token - The JWT token string.
     * @returns {object|null} The decoded payload or null if invalid.
     */
    export const decodeToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode token:", e);
        return null;
    }
    };

    /**
     * Retrieves the stored JWT token.
     * @returns {string|null} The token or null.
     */
    export const getToken = () => {
    return localStorage.getItem('jwtToken');
    };

    /**
     * Stores the JWT token and extracts the role from it.
     * @param {string} token - The JWT token.
     * @returns {string|null} The user's role (ADMIN or USER) or null.
     */
    export const setTokenAndGetRole = (token) => {
    localStorage.setItem('jwtToken', token);
    const payload = decodeToken(token);
    if (payload && payload.roles && payload.roles.length > 0) {
        return payload.roles[0]; // Assuming the first role is the primary one
    }
    return null;
    };

    /**
     * Clears the stored token.
     */
    export const clearToken = () => {
    localStorage.removeItem('jwtToken');
    };

    /**
     * Checks the user's current role based on the stored token.
     * @returns {string|null} The user's role (ADMIN or USER) or null.
     */
    export const getUserRole = () => {
    const token = getToken();
    if (!token) return null;

    const payload = decodeToken(token);
    if (payload && payload.roles && payload.roles.length > 0) {
        // Check if token is expired (optional but good practice)
        if (payload.exp * 1000 < Date.now()) {
            clearToken();
            return null;
        }
        return payload.roles[0]; // e.g., "ADMIN" or "USER"
    }
    return null;
    };

    /**
     * Retrieves the username of the currently logged-in user.
     * @returns {string|null} The username or null.
     */
    export const getLoggedInUsername = () => {
    const token = getToken();
    if (token) {
        // Use the existing decodeToken utility function
        const decoded = decodeToken(token); 
        
        // Assuming your JWT payload uses the 'sub' field for the username/subject
        if (decoded && decoded.sub) {
            return decoded.sub; 
        }
    }
    return null;
    };

