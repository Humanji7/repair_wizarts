// Token storage management for new API architecture
const TOKEN_STORAGE_KEY = 'auth_tokens';

// Save tokens as object { access_token, refresh_token }
const setToken = (tokenData) => {
  if (tokenData && (tokenData.access_token || tokenData.refresh_token)) {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
  }
};

// Get tokens from localStorage, returns { access_token, refresh_token, token, hash } or null
const getToken = () => {
  try {
    // First try new format
    let tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (tokenData) {
      const newFormat = JSON.parse(tokenData);
      // Return new format with legacy fields for compatibility
      return {
        ...newFormat,
        token: newFormat.access_token,
        // Note: hash field is not available in new format, will be undefined
      };
    }

    // Fallback to legacy userdata format
    const legacyData = localStorage.getItem('userdata');
    if (legacyData) {
      const legacyFormat = JSON.parse(legacyData);
      return {
        access_token: legacyFormat.token,
        refresh_token: legacyFormat.refresh_token,
        token: legacyFormat.token,
        hash: legacyFormat.hash,
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing token data:', error);
    return null;
  }
};

// Update existing tokens with new data
const updateToken = (tokenData) => setToken(tokenData);

// Clear all tokens from localStorage
const clearToken = () => localStorage.removeItem(TOKEN_STORAGE_KEY);

// Legacy compatibility - keep old userdata storage for backward compatibility
const removeToken = () => {
  clearToken();
  localStorage.removeItem('userdata');
};

export { setToken, getToken, updateToken, clearToken, removeToken };
