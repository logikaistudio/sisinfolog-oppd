import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    // Check if user session exists in localStorage
    // In a real app, you might verify token validity with API
    const user = localStorage.getItem('user');
    const location = useLocation();

    if (!user) {
        // Redirect to login page if not authenticated
        // Pass current location in state so we can redirect back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
