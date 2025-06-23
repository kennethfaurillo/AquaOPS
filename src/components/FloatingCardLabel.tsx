interface FloatingCardLabelProps {
    title: string;
    subtitle: string;
    icon?: React.ReactNode;
    className?: string;
}

export default function FloatingCardLabel({ title, subtitle, icon, className }: FloatingCardLabelProps) {
    return (
        <div className={`p-3 text-white bg-piwad-lightblue-600 rounded-lg flex gap-x-2 items-center ${className}`}>
            {icon}
            <div className='flex-col'>
                <div className='font-semibold '>
                    {title}
                </div>
                <div className='text-blue-100 font-normal text-xs tracking-normal'>
                    {subtitle}
                </div>
            </div>
        </div>
    )
}
