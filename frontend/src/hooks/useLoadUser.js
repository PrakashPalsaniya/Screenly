import { useEffect, useState } from "react";
import { getUser } from "../apis";
import { useAuth } from "../context/AuthContext";
import { setSocketAuth } from "../utils/socket";


export const useLoadUser = () => {
    const [ isLoading, setIsLoading ] = useState(true);
    const { setUser, setAuth } = useAuth();

    useEffect(() => {
        let timeoutId;

        (async () => {
            try {
                const { data } = await getUser();
                setUser(data);
                setAuth(true);
                setSocketAuth(data._id, data.email);
            } catch (error) {
                // Silently fail - user is not logged in yet, which is fine
                console.log("Not logged in:", error?.message);
            } finally {
                setIsLoading(false);
            }
        })();

        // Safety timeout - force loading to false after 5 seconds
        timeoutId = setTimeout(() => {
            setIsLoading(false);
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, [setUser, setAuth]);


    return { isLoading };
}
