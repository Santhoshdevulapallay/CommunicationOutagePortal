import { createContext, useContext } from "react";

export const UserContext = createContext({});

export const UserContextProvider = UserContext.Provider;

export default function useUserContext(){

    const user = useContext(UserContext);

    if (user == undefined){
        throw new Error("useUserContext must be used with a UserContextProvider");
    }
    
    return user;
}