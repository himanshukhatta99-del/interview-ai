import { createContext } from "react"

// The context object itself. The component that fills it lives in AuthProvider.jsx
// (kept in a separate file so React's fast refresh keeps working).
export const AuthContext = createContext(null)
