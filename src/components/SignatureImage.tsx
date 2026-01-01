'use client';

import { useEffect, useRef } from 'react';

interface SignatureImageProps {
    signatureData: string;
    transactionNumber: string;
    signedAt: Date;
    className?: string;
}

export default function SignatureImage({
    signatureData,
    transactionNumber,
    signedAt,
    className = ''
}: SignatureImageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Set canvas size
            const targetHeight = 32; // h-8 = 32px
            const aspectRatio = img.width / img.height;
            const targetWidth = targetHeight * aspectRatio;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Draw signature
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Add watermark overlay
            ctx.save();

            // Semi-transparent watermark background
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 8px monospace';

            const watermarkText = `${transactionNumber} • ${new Date(signedAt).toLocaleDateString()}`;
            const textWidth = ctx.measureText(watermarkText).width;

            // Draw watermark diagonally across the signature
            ctx.translate(targetWidth / 2, targetHeight / 2);
            ctx.rotate(-Math.PI / 12); // -15 degrees
            ctx.fillText(watermarkText, -textWidth / 2, 0);

            ctx.restore();
        };

        img.src = signatureData;
    }, [signatureData, transactionNumber, signedAt]);

    return (
        <div className="relative inline-block">
            <canvas
                ref={canvasRef}
                className={`${className} pointer-events-none select-none`}
                style={{
                    imageRendering: 'crisp-edges',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                }}
                onContextMenu={(e) => e.preventDefault()}
            />
            {/* Additional watermark text below */}
            <div className="text-[8px] text-slate-400 font-mono mt-0.5 select-none pointer-events-none">
                {transactionNumber}
            </div>
        </div>
    );
}
