import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Types
interface AuthTokens { access: string; refresh: string; }
interface User {
  email: string;
  username: string;
  user_id?: string;
}

interface AuthContextType {
  user: User | null;
  authTokens: AuthTokens | null;
  registerPasskey: (email: string, username: string) => Promise<void>;
  loginWithPasskey: (email: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;  // ← AJOUTÉ
}

// Helpers
const API = 'http://localhost:8000/api';

function base64ToUint8Array(base64: string | undefined | null): Uint8Array {
  if (!base64) return new Uint8Array(0);
  try {
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (e) {
    console.error("base64 decode error:", base64);
    throw e;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toast(title: string, icon: 'success' | 'error') {
  Swal.fire({
    title, icon, toast: true, timer: 5000,
    position: 'top-right', timerProgressBar: true, showConfirmButton: false
  });
}

// Context
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authTokens, setAuthTokens] = useState<AuthTokens | null>(() => {
    const stored = localStorage.getItem('authTokens');
    return stored ? JSON.parse(stored) : null;
  });

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('authTokens');
    return stored ? jwtDecode<User>(JSON.parse(stored).access) : null;
  });

  const navigate = useNavigate();

  const saveTokens = (tokens: AuthTokens) => {
    const decoded: any = jwtDecode(tokens.access);
    const userData: User = {
      email: decoded.email || '',
      username: decoded.username || '',
      user_id: decoded.user_id
    };
    setUser(userData);
    setAuthTokens(tokens);
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // ====================== REFRESH TOKEN ======================
  const refreshToken = async () => {
    if (!authTokens?.refresh) return

    try {
      const response = await fetch(`${API}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: authTokens.refresh })
      })

      const data = await response.json()

      if (response.status === 200) {
        saveTokens(data)
        console.log("✅ Token rafraîchi avec succès")
      } else {
        // Refresh token expiré → déconnexion
        console.warn("⚠️ Refresh token expiré → déconnexion")
        logout()
      }
    } catch (error) {
      console.error("Erreur refresh token:", error)
      logout()
    }
  }

  // ====================== AUTO-REFRESH toutes les 4 minutes ======================
  useEffect(() => {
    if (authTokens) {
      setUser(jwtDecode<User>(authTokens.access))
    }

    // Auto-refresh toutes les 4 minutes
    const interval = setInterval(() => {
      if (authTokens) {
        console.log("🔄 Auto-refresh du token...")
        refreshToken()
      }
    }, 1000 * 60 * 4) // 4 minutes

    return () => clearInterval(interval)
  }, [authTokens])

  // ====================== REGISTER PASSKEY ======================
  const registerPasskey = async (email: string, username: string) => {
    try {
      console.log("=== PASSKEY REGISTRATION STARTED ===");

      const randomPassword = crypto.randomUUID();

      // Step 1: Create user
      const registerRes = await fetch(`${API}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password: randomPassword, password2: randomPassword }),
      });

      if (!registerRes.ok) {
        const errText = await registerRes.text();
        console.error("Step 1 failed:", errText);
        toast('Registration failed', 'error');
        return;
      }

      console.log("✅ User created successfully");

      // Step 2: Get WebAuthn options
      const optionsRes = await fetch(`${API}/passkey/register/begin/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) {
        const errText = await optionsRes.text();
        console.error("Step 2 failed:", errText);
        toast('Could not start passkey setup', 'error');
        return;
      }

      const optionsText = await optionsRes.text();

      let options;
      try {
        options = JSON.parse(optionsText);
        if (typeof options === "string") {
          console.warn("⚠️ Options was a string, parsing again...");
          options = JSON.parse(options);
        }
        console.log("✅ Successfully parsed options");
      } catch (e) {
        console.error("JSON parse failed");
        toast('Invalid response from server', 'error');
        return;
      }

      options.challenge = base64ToUint8Array(options.challenge);

      if (options.user?.id) {
        options.user.id = base64ToUint8Array(options.user.id);
      }

      if (options.authenticatorSelection) {
        options.authenticatorSelection.userVerification = 'preferred';
        options.authenticatorSelection.residentKey = 'preferred';
      }

      console.log("Calling navigator.credentials.create() now...");

      let credential: PublicKeyCredential;
      try {
        credential = await navigator.credentials.create({ publicKey: options }) as PublicKeyCredential;
        console.log("✅ Credential created successfully");
      } catch (err: any) {
        console.error("❌ navigator.credentials.create failed:", err.name, err.message);
        toast(`Passkey creation failed: ${err.name}`, 'error');
        return;
      }

      const attResponse = credential.response as AuthenticatorAttestationResponse;

      // Step 4: Send to backend
      const verifyRes = await fetch(`${API}/passkey/register/complete/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: credential.id,
          rawId: arrayBufferToBase64(credential.rawId),
          type: credential.type,
          response: {
            clientDataJSON: arrayBufferToBase64(attResponse.clientDataJSON),
            attestationObject: arrayBufferToBase64(attResponse.attestationObject),
          },
        }),
      });

      if (verifyRes.ok) {
        toast('Passkey registered successfully!', 'success');
        navigate('/');
      } else {
        const errText = await verifyRes.text();
        console.error("Step 4 failed:", errText);
        toast('Passkey verification failed', 'error');
      }

    } catch (err: any) {
      console.error("💥 Unexpected error in registerPasskey:", err);
      toast('Unexpected error during registration', 'error');
    }
  };

  // ====================== LOGIN PASSKEY ======================
  const loginWithPasskey = async (email: string) => {
    try {
      console.log("=== PASSKEY LOGIN STARTED ===");

      const res = await fetch(`${API}/passkey/login/begin/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Login begin failed:", err);
        toast("Login failed", "error");
        return;
      }

      let options: any = await res.json();

      if (typeof options === "string") {
        options = JSON.parse(options);
      }

      console.log("✅ Login options received");

      options.challenge = base64ToUint8Array(options.challenge);

      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map((cred: any) => ({
          ...cred,
          id: base64ToUint8Array(cred.id),
        }));
      }

      console.log("Calling navigator.credentials.get()...");

      const assertion = await navigator.credentials.get({ publicKey: options });

      if (!assertion) {
        console.warn("❌ No credential returned (user cancelled)");
        toast("Authentication cancelled", "error");
        return;
      }

      const credential = assertion as PublicKeyCredential;
      const authResponse = credential.response as AuthenticatorAssertionResponse;

      const verifyRes = await fetch(`${API}/passkey/login/complete/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: credential.id,
          rawId: arrayBufferToBase64(credential.rawId),
          type: credential.type,
          response: {
            clientDataJSON: arrayBufferToBase64(authResponse.clientDataJSON),
            authenticatorData: arrayBufferToBase64(authResponse.authenticatorData),
            signature: arrayBufferToBase64(authResponse.signature),
            userHandle: authResponse.userHandle
              ? arrayBufferToBase64(authResponse.userHandle)
              : null,
          },
        }),
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        saveTokens(data);
        toast("Logged in successfully!", "success");
        navigate("/");
      } else {
        const err = await verifyRes.text();
        console.error("Login verify failed:", err);
        toast("Login verification failed", "error");
      }

    } catch (err) {
      console.error("💥 Unexpected login error:", err);
      toast("Unexpected login error", "error");
    }
  };

  // ====================== LOGOUT ======================
  const logout = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');
    navigate('/');
    toast('You have been logged out.', 'success');
  };

  return (
    <AuthContext.Provider value={{
      user,
      authTokens,
      registerPasskey,
      loginWithPasskey,
      logout,
      refreshToken,  // ← AJOUTÉ
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};