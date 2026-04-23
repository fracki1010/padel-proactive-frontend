import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CLIENT_TOKEN_KEY = "padexa:client_token";
const CLIENT_USER_KEY = "padexa:client_user";

interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ClientAuthContextValue {
  clientToken: string | null;
  clientUser: ClientUser | null;
  loginClient: (token: string, user: ClientUser) => void;
  logoutClient: () => void;
  isClientAuthenticated: boolean;
}

const ClientAuthContext = createContext<ClientAuthContextValue>({
  clientToken: null,
  clientUser: null,
  loginClient: () => {},
  logoutClient: () => {},
  isClientAuthenticated: false,
});

export const ClientAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [clientToken, setClientToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CLIENT_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [clientUser, setClientUser] = useState<ClientUser | null>(() => {
    try {
      const raw = localStorage.getItem(CLIENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const loginClient = useCallback((token: string, user: ClientUser) => {
    localStorage.setItem(CLIENT_TOKEN_KEY, token);
    localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(user));
    setClientToken(token);
    setClientUser(user);
  }, []);

  const logoutClient = useCallback(() => {
    localStorage.removeItem(CLIENT_TOKEN_KEY);
    localStorage.removeItem(CLIENT_USER_KEY);
    setClientToken(null);
    setClientUser(null);
  }, []);

  const value = useMemo(
    () => ({
      clientToken,
      clientUser,
      loginClient,
      logoutClient,
      isClientAuthenticated: Boolean(clientToken && clientUser),
    }),
    [clientToken, clientUser, loginClient, logoutClient],
  );

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};

export const useClientAuth = () => useContext(ClientAuthContext);
