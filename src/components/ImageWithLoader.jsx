import React, { useState } from 'react';

export function ImageWithLoader({ src, alt, className = "", containerClassName = "" }) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative overflow-hidden ${containerClassName}`}>
            {/* Loading Skeleton/Blur */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/10 animate-pulse backdrop-blur-md flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
            )}

            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-all duration-700 ease-out ${isLoading ? 'scale-110 blur-xl grayscale' : 'scale-100 blur-0 grayscale-0'
                    } ${className}`}
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
}
