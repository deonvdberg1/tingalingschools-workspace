import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    // This component previously tracked navigation via Base44's analytics.
    // With Supabase, analytics is handled differently or not needed.
    useEffect(() => {
        if (isAuthenticated) {
            // Navigation tracking placeholder
            // Future: add page_view events to an analytics table if needed
        }
    }, [location, isAuthenticated]);

    return null;
}
