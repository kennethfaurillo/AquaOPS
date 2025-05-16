
interface CoolLoaderProps {
    title?: string;
    message?: string;
}

export default function CoolLoader({title, message}: CoolLoaderProps) {
    return (
        <div className="flex items-center justify-center h-screen w-full bg-slate-50 rounded-lg border border-slate-200 p-6">
            <div className="text-center">
                <div className="animate-spin mb-3 h-8 w-8 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto"></div>
                <p className="text-slate-600 font-medium">{title ?? 'Loading user data...'}</p>
                <p className="text-slate-400 text-sm">{message ?? 'Please wait a moment'}</p>
            </div>
        </div>
    )
}
