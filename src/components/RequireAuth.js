import React, { useEffect, useState } from "react"; // 👈 Added useState
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RequireAuth = ({ children, product }) => {
    
    const { isLoggedIn, product: loggedProduct, logout } = useAuth();
    // 👈 NEW STATE: Tracks if we are currently logging out to switch modules
    const [isSwitching, setIsSwitching] = useState(false); 

    // Define the side effect (logout) unconditionally
    useEffect(() => {
        // Logic: If the user is logged in, but the product type does not match the route requirement, initiate switch.
        if (isLoggedIn && loggedProduct && loggedProduct !== product) {
            console.log(`Mismatch detected: Initiating switch from ${loggedProduct} to ${product}.`);
            
            // 1. Set the flag to true
            setIsSwitching(true); 
            
            // 2. Perform the logout (This causes a global state update/re-render)
            logout();
        }
    }, [isLoggedIn, logout, loggedProduct, product]);
    
    // CONDITIONAL RETURN LOGIC
    
    // 1. BLOCK ALL UI RENDERING DURING SWITCH
    if (isSwitching) {
        // If the flag is set, don't show children OR the login page yet.
        // This prevents the flickering of the incorrect UI.
        return <div>Switching modules...</div>; 
    }

    // 2. Logged Out Check
    if (!isLoggedIn) {
        // The component lands here after the logout() call completes
        return <Navigate to={product === "EWAY" ? "/ewaybill-login" : "/einvoice-login"} replace />;
    }

    // 3. Product Mismatch Check (Should only hit if isSwitching was false)
    if (loggedProduct !== product) {
        // This case should be rare now, as the useEffect should handle it,
        // but it acts as a safety redirect to finalize the flow.
        return <Navigate to={product === "EWAY" ? "/ewaybill-login" : "/einvoice-login"} replace />;
    }

    // 4. Access Granted
    return children;
};

export default RequireAuth;