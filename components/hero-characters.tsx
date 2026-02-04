export function HeroCharacters() {
    return (
        <svg
            viewBox="0 0 800 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-contain"
        >
            {/* Abstract Background Shapes */}
            <circle cx="600" cy="150" r="40" stroke="black" strokeWidth="3" />
            <path d="M700 500 L750 450 L800 500" stroke="black" strokeWidth="3" fill="none" />
            <rect x="50" y="450" width="60" height="60" rx="30" stroke="black" strokeWidth="3" />

            {/* Character 1: Sitting with Laptop/Phone */}
            <g transform="translate(150, 200)">
                {/* Legs */}
                <path d="M80 180 Q100 240 160 220 L180 280" stroke="black" strokeWidth="4" strokeLinecap="round" fill="white" />
                <path d="M60 180 Q40 240 20 280" stroke="black" strokeWidth="4" strokeLinecap="round" fill="white" />

                {/* Body */}
                <path d="M40 180 C20 120 60 80 100 90 C140 100 160 140 140 200" stroke="black" strokeWidth="4" fill="white" />

                {/* Head */}
                <circle cx="90" cy="60" r="30" stroke="black" strokeWidth="4" fill="white" />
                {/* Hair */}
                <path d="M60 60 Q60 20 90 20 Q120 20 120 60" stroke="black" strokeWidth="4" fill="white" />

                {/* Arms holding device */}
                <path d="M110 130 L160 140 L150 110" stroke="black" strokeWidth="4" strokeLinecap="round" fill="white" />
                <rect x="140" y="90" width="50" height="40" rx="4" transform="rotate(-15 140 90)" stroke="black" strokeWidth="4" fill="white" />
            </g>

            {/* Character 2: Standing and Laughing */}
            <g transform="translate(400, 150)">
                {/* Legs */}
                <path d="M60 250 L60 380" stroke="black" strokeWidth="4" strokeLinecap="round" fill="white" />
                <path d="M100 250 L120 380" stroke="black" strokeWidth="4" strokeLinecap="round" fill="white" />

                {/* Body */}
                <path d="M40 100 L120 100 L130 250 L30 250 Z" stroke="black" strokeWidth="4" fill="white" />

                {/* Head */}
                <circle cx="80" cy="70" r="35" stroke="black" strokeWidth="4" fill="white" />
                <path d="M70 75 Q80 85 90 75" stroke="black" strokeWidth="3" fill="none" /> {/* Smile */}

                {/* Arms */}
                <path d="M40 120 Q10 180 30 220" stroke="black" strokeWidth="4" strokeLinecap="round" fill="white" />
                <path d="M120 120 Q160 100 170 60" stroke="black" strokeWidth="4" strokeLinecap="round" fill="white" />
            </g>

            {/* Character 3: Peeking/Floating */}
            <g transform="translate(600, 300)">
                <path d="M0 100 Q50 0 100 100" stroke="black" strokeWidth="4" fill="white" />
                <path d="M0 100 L0 200 L100 200 L100 100" stroke="black" strokeWidth="4" fill="white" />

                {/* Face */}
                <circle cx="35" cy="60" r="5" fill="black" />
                <circle cx="65" cy="60" r="5" fill="black" />
                <path d="M40 80 Q50 90 60 80" stroke="black" strokeWidth="3" fill="none" />
            </g>

            {/* Floor/Ground Elements */}
            <path d="M50 550 L750 550" stroke="black" strokeWidth="4" strokeLinecap="round" />
            <path d="M100 570 L200 570" stroke="black" strokeWidth="4" strokeLinecap="round" />

            {/* Decor */}
            <circle cx="300" cy="100" r="10" stroke="black" strokeWidth="3" />
            <path d="M500 50 L520 70 M520 50 L500 70" stroke="black" strokeWidth="3" />
        </svg>
    );
}
