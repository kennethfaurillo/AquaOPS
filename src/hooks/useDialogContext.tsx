import AddSourceDialog from "@/components/addSourceDialog"
import { createContext, useContext, useMemo, useState } from "react"

const DialogContext = createContext()

export function DialogProvider({ children }) {
    const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false)

    const value = useMemo(() => ({
        addSourceDialogOpen, setAddSourceDialogOpen
    }), [addSourceDialogOpen])

    return (
        <DialogContext.Provider value={value}>
            <AddSourceDialog addSourceDialogOpen={addSourceDialogOpen} setAddSourceDialogOpen={setAddSourceDialogOpen}/>
            {children}
        </DialogContext.Provider >
    )
}

export const useDialogContext = () => useContext(DialogContext)