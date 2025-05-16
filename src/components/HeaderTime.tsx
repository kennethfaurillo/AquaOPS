import { useEffect, useState } from 'react';

interface HeaderTimeProps {
    color?: 'white' | 'black';
}

const HeaderTime: React.FC<HeaderTimeProps> = ({ color = 'white' }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => {
            clearInterval(timer);
        };
    }, []);

    const timeColor = color === 'black' ? 'text-gray-800' : 'text-white';
    const subTextColor = color === 'black' ? 'text-gray-800' : 'text-zinc-200';
    const dateColor = color === 'black' ? 'text-gray-600' : 'text-slate-50';

    return (
        <div className='flex gap-x-4 items-center h-full mx-4'>
            <div className={`py-1 px-3 rounded-full bg-gray-200 flex gap-x-1 font-medium ${timeColor} text-base`}>
                {time.toLocaleTimeString().slice(0, -2)}
                <div className={`font-normal ${subTextColor} text-sm self-center`}>
                    {time.toLocaleTimeString().slice(-2)}
                </div>
            </div>
            <div className={`font-normal ${dateColor} text-sm text-right`}>
                {time.toDateString()}
            </div>
        </div>
    );
};

export default HeaderTime;