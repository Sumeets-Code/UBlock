import { useRef, useEffect } from 'react';

const LetterGlitch = ({
    glitchColors = ['#2b4539', '#61dca3', '#61b3dc'],
    glitchSpeed = 50,
    smooth = true,
    centerVignette = true,
    outerVignette = true,
}) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const letters = useRef([]);
    const grid = useRef({ columns: 0, rows: 0 });
    const context = useRef(null);
    const lastGlitchTime = useRef(Date.now());

    const fontSize = 16;
    const charWidth = 10;
    const charHeight = 20;

    const lettersAndSymbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[]<>?/'.split('');

    const getRandomChar = () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
    const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

    const calculateGrid = (width, height) => ({
        columns: Math.ceil(width / charWidth),
        rows: Math.ceil(height / charHeight),
    });

    const initializeLetters = (columns, rows) => {
        grid.current = { columns, rows };
        letters.current = Array.from({ length: columns * rows }, () => ({
            char: getRandomChar(),
            color: getRandomColor(),
            targetColor: getRandomColor(),
            colorProgress: 1,
        }));
    };

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();

        // Ensure the canvas has the correct size for high-DPI displays
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Set the transform for the context for high-DPI support
        if (context.current) {
            context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        const { columns, rows } = calculateGrid(rect.width, rect.height);
        initializeLetters(columns, rows);
        drawLetters();
    };

    const drawLetters = () => {
        const canvas = canvasRef.current;
        const ctx = context.current;

        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px monospace`;
        ctx.textBaseline = 'top';

        letters.current.forEach((letter, index) => {
            const x = (index % grid.current.columns) * charWidth;
            const y = Math.floor(index / grid.current.columns) * charHeight;
            ctx.fillStyle = letter.color;
            ctx.fillText(letter.char, x, y);
        });
    };

    const updateLetters = () => {
        const updateCount = Math.max(1, Math.floor(letters.current.length * 0.05));

        for (let i = 0; i < updateCount; i++) {
            const index = Math.floor(Math.random() * letters.current.length);
            if (!letters.current[index]) continue;

            letters.current[index].char = getRandomChar();
            letters.current[index].targetColor = getRandomColor();
            letters.current[index].colorProgress = smooth ? 0 : 1;
        }
    };

    const animate = () => {
        const canvas = canvasRef.current;
        const now = Date.now();

        if (now - lastGlitchTime.current >= glitchSpeed) {
            updateLetters();
            drawLetters();
            lastGlitchTime.current = now;
        }

        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        context.current = canvas.getContext('2d');
        resizeCanvas(); // Ensure the canvas is initialized
        animate(); // Start the animation loop

        window.addEventListener('resize', resizeCanvas); // Handle resizing
        return () => {
            cancelAnimationFrame(animationRef.current); // Cleanup animation
            window.removeEventListener('resize', resizeCanvas); // Remove event listener
        };
    }, []);

    const containerStyle = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: -1,
        backgroundColor: '#000000',
        overflow: 'hidden',
        pointerEvents: 'none', // ✅ Add this
    };

    const canvasStyle = {
        display: 'block',
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // ✅ Add this too
    };

    const outerVignetteStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,1) 100%)',
    };

    const centerVignetteStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)',
    };

    return (
        <div style={containerStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />
            {outerVignette && <div style={outerVignetteStyle}></div>}
            {centerVignette && <div style={centerVignetteStyle}></div>}
        </div>
    );
};

export default LetterGlitch;