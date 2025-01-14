import { useEffect, useState } from 'react'

const Time = () => {
    const [time, setTime] = useState(new Date())
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)
        return () => {
            clearInterval(timer)
        }
    }, [])
    return (
        <div>
            <div className='font-normal text-white text-3xl  flex gap-x-1'>
                {time.toLocaleTimeString().slice(0, -2)}
                <div className='font-normal text-zinc-200 text-xl'>
                    {time.toLocaleTimeString().slice(-2,)}
                </div>
            </div>
            <div className='font-normal text-slate-50 text-sm text-right tracking-tight'>
                {time.toDateString()}
            </div>
        </div>
    )
}

export default Time