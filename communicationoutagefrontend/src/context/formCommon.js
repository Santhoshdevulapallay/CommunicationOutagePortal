import { createContext, useContext } from "react";

const monthNames = ["January", "February", "March", "April", "May", 
                    "June", "July", "August", "September", "October", 
                    "November", "December"
                   ];

// const categoryEnum = [ {key : 'ANALOG', value : 'ANALOG'}, 
//                         {key : 'POINT', value : 'POINT'},
//                         {key : 'ALL', value : 'ALL'}
//                       ]
const categoryEnum = [ 
                        {key : 'ALL', value : 'ALL'}
                      ]
const indianStates = [  { key: 'AP', value: 'AP' }, 
                        { key: 'TG', value: 'TG' },
                        { key: 'TN', value: 'TN' },
                        { key: 'KA', value: 'KA' },
                        { key: 'KL', value: 'KL' },
                        { key: 'CS', value: 'CS' },
                        { key: 'SR-1', value: 'SR1' },
                        { key: 'SR-2', value: 'SR2' },
                        { key: 'PY', value: 'PY' },
                        { key: 'TL', value: 'TL' },
                        { key: 'CS_RE', value: 'CS_RE' },
                        { key: 'CS_REMC', value: 'CS_REMC' },
                     ]

export const FormCommonContext = createContext({monthNames, categoryEnum, indianStates});

export const FormCommonContextProvider = FormCommonContext.Provider;

export default function useFormCommonContext(){

    const formCommon = useContext(FormCommonContext);

    if (formCommon === undefined){
        throw new Error("useFormCommonContext must be used in FormCommonContextProvider");
    }

    return formCommon;
}