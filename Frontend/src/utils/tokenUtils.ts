// src/utils/tokenUtils.ts

export function decodeToken(): any {
  try {
    const tokens = localStorage.getItem('authTokens');
    if (!tokens) return null;
    
    const { access } = JSON.parse(tokens);
    // Décoder le payload du JWT (partie du milieu)
    const payload = access.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    
    return decoded;
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return null;
  }
}

export function getUserFromToken() {
  const decoded = decodeToken();
  if (!decoded) return null;
  
  return {
    user_id: decoded.user_id,
    username: decoded.username,
    email: decoded.email,
  };
}

export function getUsernameFromToken(): string | null {
  const decoded = decodeToken();
  return decoded?.username || null;
}

export function getUserIdFromToken(): string | null {
  const decoded = decodeToken();
  return decoded?.user_id || null;
}