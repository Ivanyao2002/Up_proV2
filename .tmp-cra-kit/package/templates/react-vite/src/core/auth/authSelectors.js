// Sélecteur racine
const selectAuth = (state) => state.auth;

// User
export const selectCurrentUser = (state) => selectAuth(state).user;

// Tokens
export const selectAccessToken = (state) => selectAuth(state).accessToken;

export const selectRefreshToken = (state) => selectAuth(state).refreshToken;

// Auth
export const selectIsAuthenticated = (state) =>
  selectAuth(state).isAuthenticated;
