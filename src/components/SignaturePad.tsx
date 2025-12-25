'use client';

import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    onChange?: (file: File | null) => void;
    onEnd?: () => void;
}

const SignaturePad = forwardRef<any, SignaturePadProps>(({ onChange, onEnd }, ref) => {
    const padRef = useRef<ReactSignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useImperativeHandle(ref, () => ({
        clear: () => {
            padRef.current?.clear();
            setIsEmpty(true);
            if (onChange) onChange(null);
        },
        isEmpty: () => padRef.current?.isEmpty() ?? true,
        toDataURL: () => padRef.current?.getTrimmedCanvas().toDataURL('image/png')
    }));

    const handleClear = () => {
        padRef.current?.clear();
        setIsEmpty(true);
        if (onChange) onChange(null);
    };

    const handleEnd = () => {
        const empty = padRef.current?.isEmpty() ?? true;
        setIsEmpty(empty);

        if (onEnd) onEnd();

        if (empty) {
            if (onChange) onChange(null);
        } else {
            padRef.current?.getCanvas().toBlob((blob) => {
                if (blob && onChange) {
                    const file = new File([blob], 'signature.png', { type: 'image/png' });
                    onChange(file);
                }
            });
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm touch-none">
                <ReactSignatureCanvas
                    ref={padRef}
                    canvasProps={{
                        className: 'w-full h-40 bg-white cursor-crosshair',
                        style: { width: '100%', height: '160px' }
                    }}
                    onEnd={handleEnd}
                    minWidth={1}
                    maxWidth={2.5}
                    velocityFilterWeight={0.7}
                />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Sign above</span>
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                >
                    <Eraser size={14} />
                    Clear
                </button>
            </div>
        </div>
    );
});

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
