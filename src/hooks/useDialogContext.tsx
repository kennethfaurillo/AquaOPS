import AddSourceDialog from "@/components/addSourceDialog"
import { createContext, useContext, useMemo, useState } from "react"

type DialogContextType = {
    addSourceDialogOpen: boolean
    setAddSourceDialogOpen: (open: boolean) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: React.ReactNode }) {
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

export const useDialogContext = () => {
    const context = useContext(DialogContext)
    if (!context) {
        throw new Error('useDialogContext must be used within a DialogProvider')
    }
    return context
}