import { createContext, useContext } from "react";

export const UserSearchParamsContext = createContext({});

export const UserSearchParamsContextProvider = UserSearchParamsContext.Provider;

export default function useUserSearchParamsContext(){

    const userSearchParams = useContext(UserSearchParamsContext);

    if (userSearchParams === undefined){
        throw new Error("useUserSearchParamsContext must be used with a UserSearchParamsContextProvider");
    }

    return userSearchParams;
}