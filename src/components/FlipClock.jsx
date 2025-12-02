import React, { useEffect, useState } from 'react';

const FlipCard = ({ digit, cardColor, cardOpacity }) => {
    const [prevDigit, setPrevDigit] = useState(digit);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        if (digit !== prevDigit) {
            setIsFlipping(true);

            const timer = setTimeout(() => {
                setIsFlipping(false);
                setPrevDigit(digit);
            }, 600);

            return () => clearTimeout(timer);
        }
    }, [digit, prevDigit]);

    // Convert hex color to rgba for opacity support if needed, 
    // but here we use opacity style on the container or background directly.
    // Ideally cardColor is a hex string like "#1c1c1e".

    const cardStyle = {
        backgroundColor: cardColor,
        opacity: cardOpacity,
    };

    // We apply the background color to the card layers. 
    // The opacity is tricky because we don't want to make the text transparent, just the background.
    // So we use a helper to inject opacity into the background color if it's hex.
    const getBgStyle = () => {
        // Simple hex to rgba conversion or just use the color and apply opacity to the div
        // If we apply opacity to the div, text also becomes transparent.
        // Let's assume the user wants the whole card (bg) transparent but text opaque?
        // Usually "background opacity" implies rgba. 
        // For simplicity, let's apply opacity to the background element if possible, 
        // or just use the opacity prop on the style if the user wants the whole card semi-transparent.
        // Given the request "modify number background color and transparency", likely means RGBA background.

        // Let's use a style object that applies the color. 
        // If we want independent background opacity, we'd need to convert hex to rgba.
        // For now, let's apply opacity to the card container's background color using a utility or inline style.

        // Actually, the easiest way to handle "background transparency" without affecting text 
        // is to use `rgba` or `hex8`. 
        // But the input is likely a color picker (hex) and a slider (0-1).
        // Let's construct the color string.

        // Helper to convert hex to rgb
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 28, g: 28, b: 30 }; // Default #1c1c1e
        };

        const rgb = hexToRgb(cardColor);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${cardOpacity})`;
    };

    const bgStyle = { backgroundColor: getBgStyle() };

    return (
        <div className="flip-card-container relative w-[140px] h-[220px] rounded-xl text-[#e5e5e5] font-mono font-bold text-[160px] leading-none shadow-2xl border border-white/5">

            {/* Static Top (New Digit) - Clipped to top half */}
            <div className="absolute inset-0 overflow-hidden rounded-xl flex items-center justify-center z-10"
                style={{ ...bgStyle, clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}>
                <span>{digit}</span>
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/20 z-20"></div>
            </div>

            {/* Static Bottom (Old Digit) - Clipped to bottom half */}
            <div className="absolute inset-0 overflow-hidden rounded-xl flex items-center justify-center z-0"
                style={{ ...bgStyle, clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }}>
                <span>{prevDigit}</span>
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/20 z-20"></div>
            </div>

            {/* Flap Front (Old Top) - Flips Down */}
            <div className={`absolute inset-0 overflow-hidden rounded-xl flex items-center justify-center origin-bottom backface-hidden z-30 ${isFlipping ? 'animate-flip-down-front' : 'hidden'}`}
                style={{ ...bgStyle, clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}>
                <span>{prevDigit}</span>
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/20 z-20"></div>
            </div>

            {/* Flap Back (New Bottom) - Flips Down */}
            <div className={`absolute inset-0 overflow-hidden rounded-xl flex items-center justify-center origin-top backface-hidden z-40 ${isFlipping ? 'animate-flip-down-back' : 'hidden'}`}
                style={{ ...bgStyle, clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }}>
                <span>{digit}</span>
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/20 z-20"></div>
            </div>

            {/* Glare/Shadow overlay for depth */}
            <div className="absolute inset-0 pointer-events-none rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] z-50"></div>
        </div>
    );
};

const FlipClock = ({ time, showSeconds = true, cardColor = '#1c1c1e', cardOpacity = 1 }) => {
    const [hours, setHours] = useState('00');
    const [minutes, setMinutes] = useState('00');
    const [seconds, setSeconds] = useState('00');

    useEffect(() => {
        if (!time) return;
        const h = time.getHours().toString().padStart(2, '0');
        const m = time.getMinutes().toString().padStart(2, '0');
        const s = time.getSeconds().toString().padStart(2, '0');
        setHours(h);
        setMinutes(m);
        setSeconds(s);
    }, [time]);

    return (
        <>
            <style>{`
                .backface-hidden {
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }
                @keyframes flip-down-front {
                    0% { transform: rotateX(0deg); }
                    100% { transform: rotateX(-180deg); }
                }
                @keyframes flip-down-back {
                    0% { transform: rotateX(180deg); }
                    100% { transform: rotateX(0deg); }
                }
                .animate-flip-down-front {
                    animation: flip-down-front 0.6s cubic-bezier(0.15, 0.45, 0.28, 1) forwards;
                }
                .animate-flip-down-back {
                    animation: flip-down-back 0.6s cubic-bezier(0.15, 0.45, 0.28, 1) forwards;
                }
            `}</style>
            <div className={`flex items-center justify-center gap-4 sm:gap-6 origin-center transition-all duration-500 ${showSeconds ? 'scale-75 sm:scale-100' : 'scale-100 sm:scale-125'}`}>
                {/* Hours */}
                <div className="flex gap-1 sm:gap-2">
                    <FlipCard digit={hours[0]} cardColor={cardColor} cardOpacity={cardOpacity} />
                    <FlipCard digit={hours[1]} cardColor={cardColor} cardOpacity={cardOpacity} />
                </div>

                {/* Minutes */}
                <div className="flex gap-1 sm:gap-2">
                    <FlipCard digit={minutes[0]} cardColor={cardColor} cardOpacity={cardOpacity} />
                    <FlipCard digit={minutes[1]} cardColor={cardColor} cardOpacity={cardOpacity} />
                </div>

                {/* Seconds */}
                {showSeconds && (
                    <div className="flex gap-1 sm:gap-2">
                        <FlipCard digit={seconds[0]} cardColor={cardColor} cardOpacity={cardOpacity} />
                        <FlipCard digit={seconds[1]} cardColor={cardColor} cardOpacity={cardOpacity} />
                    </div>
                )}
            </div>
        </>
    );
};

export default FlipClock;
