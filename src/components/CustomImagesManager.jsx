import React, { useState, useCallback } from 'react';
import { Upload, Trash2, ImagePlus } from 'lucide-react';
import { getCustomImages, addCustomImage, removeCustomImage } from '../services/customImages';

export function CustomImagesManager({ customImages, onRefresh, useCustomImages, onUseCustomImagesChange }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleUpload = useCallback(async (e) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        setError(null);
        setUploading(true);
        try {
            await addCustomImage(file);
            onRefresh?.();
        } catch (err) {
            setError(err?.message || 'Failed to add image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [onRefresh]);

    const handleRemove = useCallback((id) => {
        removeCustomImage(id);
        onRefresh?.();
    }, [onRefresh]);

    const canUseCustom = customImages.length >= 2;

    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white/80">My Images</span>
                </div>
                <span className="text-xs text-white/40">
                    {customImages.length}/{24}
                </span>
            </div>
            <p className="text-xs text-white/50">
                Upload images to use in rounds. Need at least 2 to play with your images.
            </p>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || customImages.length >= 24}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Upload className="w-4 h-4" />
                {uploading ? 'Adding...' : 'Add Image'}
            </button>
            {error && (
                <p className="text-xs text-red-400">{error}</p>
            )}
            {customImages.length > 0 && (
                <>
                    <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                        {customImages.map((img) => (
                            <div
                                key={img.id}
                                className="relative aspect-square rounded-lg overflow-hidden group"
                            >
                                <img
                                    src={img.url}
                                    alt={img.label}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemove(img.id)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={`Remove ${img.label}`}
                                >
                                    <Trash2 className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                    {canUseCustom && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useCustomImages}
                                onChange={(e) => onUseCustomImagesChange?.(e.target.checked)}
                                className="rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                            />
                            <span className="text-sm text-white/70">Use my images in rounds</span>
                        </label>
                    )}
                </>
            )}
        </div>
    );
}
