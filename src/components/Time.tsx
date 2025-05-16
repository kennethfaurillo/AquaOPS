import { useEffect, useState } from 'react';

interface TimeProps {
    color?: 'white' | 'black';
}

const Time: React.FC<TimeProps> = ({ color = 'white' }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => {
            clearInterval(timer);
        };
    }, []);

    const textColor = color === 'black' ? 'text-black' : 'text-white';
    const subTextColor = color === 'black' ? 'text-gray-800' : 'text-zinc-200';
    const dateTextColor = color === 'black' ? 'text-gray-600' : 'text-slate-50';

    return (
        <div className='rounded-3xl px-1 mb-2'>
            <div className={`font-normal ${textColor} text-5xl flex gap-x-1`}>
                {time.toLocaleTimeString().slice(0, -2)}
                <div className={`font-normal ${subTextColor} text-xl`}>
                    {time.toLocaleTimeString().slice(-2)}
                </div>
            </div>
            <div className={`font-normal ${dateTextColor} text-sm text-right tracking-tight`}>
                {time.toDateString()}
            </div>
        </div>
    );
};

export default Time;