import { useRef, useEffect } from 'react';

export default function useIsFirstRender(): boolean {
    const isFirstRenderRef = useRef(true);
    useEffect(() => {
        isFirstRenderRef.current = false;
    }, []);
    return isFirstRenderRef.current;
};