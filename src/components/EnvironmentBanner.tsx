const mode = import.meta.env.MODE;

export const EnvironmentBanner = () => {
    if (mode === 'production') return null; // Don’t show in production

    const bannerColor = {
        development: 'lightblue',
        uat: 'orange',
    }[mode] || 'gray';

    return (
        <div
            className={`pointer-events-none
            fixed top-0 w-full z-[1000] text-center font-bold py-1
            ${mode === 'development' ? 'bg-yellow-300/60' : mode === 'uat' ? 'bg-orange-400/50' : 'bg-gray-400/50'}
            text-black
            `}
        >
            {mode.toUpperCase()} MODE
        </div>
    );
};
