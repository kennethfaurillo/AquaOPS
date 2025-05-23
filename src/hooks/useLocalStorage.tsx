import { useState } from "react";

export const useLocalStorage = (keyName: string, defaultValue: unknown) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const value = window.localStorage.getItem(keyName)
            if (value) {
                return JSON.parse(value)
            } else {
                window.localStorage.setItem(keyName, JSON.stringify(defaultValue))
                return defaultValue
            }
        } catch (error) {
            return defaultValue;
        }
    })

    const setValue = (newValue: unknown) => {
        try {
            window.localStorage.setItem(keyName, JSON.stringify(newValue))
        } catch (error) {
            console.log(error)
        }
        setStoredValue(newValue)
    }
    return [storedValue, setValue]
}