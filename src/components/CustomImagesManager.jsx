import React, { useState, useCallback, useRef } from 'react';
import { Upload, Trash2, ImagePlus, Film, Laugh } from 'lucide-react';
import { addCustomImage, addCustomMeme, addCustomVideo, addCustomYoutubeVideo, removeCustomImage, getStorageUsage } from '../services/customImages';
import { getYoutubeVideoIdFromAsset } from '../lib/youtube';
import { MEDIA_TYPES } from '../data/themes';
import { useTranslation } from '../hooks/useTranslation';

const TYPE_BADGES = {
    image: 'Image',
    meme: 'Meme',
    video: 'Video',
};

export function CustomImagesManager({
    customImages,
    onRefresh,
    useCustomImages,
    onUseCustomImagesChange,
    mediaType = MEDIA_TYPES.IMAGE,
}) {
    const { t } = useTranslation();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const imageInputRef = useRef(null);
    const memeInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const storage = getStorageUsage();

    const supportsMemesVideos = mediaType === MEDIA_TYPES.MEMES_VIDEOS;
    const supportsVideoOnly = mediaType === MEDIA_TYPES.VIDEO;
    const supportsYoutube = supportsMemesVideos || supportsVideoOnly;
    const memeCount = customImages.filter((item) => item.type === 'meme' || item.type === 'image' || !item.type).length;
    const videoCount = customImages.filter((item) => item.type === 'video').length;

    const canUseCustom = supportsMemesVideos
        ? memeCount >= 1 && videoCount >= 1
        : supportsVideoOnly
            ? videoCount >= 2
            : customImages.length >= 2;

    const handleUpload = useCallback(async (file, kind) => {
        if (!file) return;
        setError(null);
        setUploading(true);
        try {
            if (kind === 'video') await addCustomVideo(file);
            else if (kind === 'meme') await addCustomMeme(file);
            else await addCustomImage(file);
            onRefresh?.();
        } catch (err) {
            setError(err?.message || 'Failed to add media');
        } finally {
            setUploading(false);
            if (imageInputRef.current) imageInputRef.current.value = '';
            if (memeInputRef.current) memeInputRef.current.value = '';
            if (videoInputRef.current) videoInputRef.current.value = '';
        }
    }, [onRefresh]);

    const handleAddYoutube = useCallback(async () => {
        const trimmed = youtubeUrl.trim();
        if (!trimmed) return;
        setError(null);
        setUploading(true);
        try {
            await addCustomYoutubeVideo(trimmed);
            setYoutubeUrl('');
            onRefresh?.();
        } catch (err) {
            setError(err?.message || 'Failed to add YouTube video');
        } finally {
            setUploading(false);
        }
    }, [youtubeUrl, onRefresh]);

    const handleRemove = useCallback((id) => {
        removeCustomImage(id);
        onRefresh?.();
    }, [onRefresh]);

    const sectionTitle = supportsMemesVideos
        ? t('lobby.myMemesVideos')
        : supportsVideoOnly
            ? t('lobby.myVideos')
            : t('lobby.myImages');

    const sectionHelp = supportsMemesVideos
        ? t('lobby.customMemesVideosHelp')
        : supportsVideoOnly
            ? t('lobby.customVideosHelp')
            : t('lobby.customImagesHelp');

    const useCustomLabel = supportsMemesVideos
        ? t('lobby.useMyMemesVideos')
        : supportsVideoOnly
            ? t('lobby.useMyVideos')
            : t('lobby.useMyImages');

    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ImagePlus className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white/80">{sectionTitle}</span>
                </div>
                <span className="text-xs text-white/40">
                    {customImages.length}/24
                </span>
            </div>
            <p className="text-xs text-white/50">{sectionHelp}</p>
            <div className="flex items-center justify-between text-xs">
                <span className="text-white/45">
                    {t('lobby.storageUsed', { used: storage.usedMB, max: storage.maxMB })}
                </span>
                <span className={`font-semibold ${storage.percentage >= 90 ? 'text-red-400' : 'text-white/60'}`}>
                    {storage.percentage}%
                </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${storage.percentage >= 90 ? 'bg-red-500' : 'bg-purple-500'}`}
                    style={{ width: `${Math.min(storage.percentage, 100)}%` }}
                />
            </div>

            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'image')} />
            <input ref={memeInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'meme')} />
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0], 'video')} />

            <div className={`grid gap-2 ${supportsMemesVideos ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {supportsMemesVideos ? (
                    <>
                        <button
                            type="button"
                            onClick={() => memeInputRef.current?.click()}
                            disabled={uploading || customImages.length >= 24 || storage.percentage >= 100}
                            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Laugh className="w-4 h-4" />
                            {uploading ? 'Adding...' : t('lobby.addMeme')}
                        </button>
                        <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            disabled={uploading || customImages.length >= 24 || storage.percentage >= 100}
                            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Film className="w-4 h-4" />
                            {uploading ? 'Adding...' : t('lobby.addVideo')}
                        </button>
                    </>
                ) : supportsVideoOnly ? (
                    <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploading || customImages.length >= 24 || storage.percentage >= 100}
                        className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Film className="w-4 h-4" />
                        {uploading ? 'Adding...' : t('lobby.addVideo')}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploading || customImages.length >= 24 || storage.percentage >= 100}
                        className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Adding...' : t('lobby.addImage')}
                    </button>
                )}
            </div>

            {supportsYoutube && (
                <div className="flex gap-2">
                    <input
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder={t('lobby.youtubeUrlPlaceholder')}
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        disabled={uploading || customImages.length >= 24}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddYoutube();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleAddYoutube}
                        disabled={uploading || !youtubeUrl.trim() || customImages.length >= 24}
                        className="shrink-0 py-2 px-3 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {t('lobby.addYoutube')}
                    </button>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-400">{error}</p>
            )}

            {customImages.length > 0 && (
                <>
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                        {customImages.map((item) => (
                            <div
                                key={item.id}
                                className="relative aspect-square rounded-lg overflow-hidden group bg-black"
                            >
                                {item.type === 'video' ? (
                                    getYoutubeVideoIdFromAsset(item) ? (
                                        <img
                                            src={item.posterUrl}
                                            alt={item.label}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <video
                                            src={item.url}
                                            className="w-full h-full object-cover"
                                            muted
                                            playsInline
                                            preload="metadata"
                                        />
                                    )
                                ) : (
                                    <img
                                        src={item.url}
                                        alt={item.label}
                                        className={`w-full h-full ${item.type === 'meme' ? 'object-contain' : 'object-cover'}`}
                                    />
                                )}
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold uppercase text-white/80">
                                    {TYPE_BADGES[item.type] || 'Image'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(item.id)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label={`Remove ${item.label}`}
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
                            <span className="text-sm text-white/70">{useCustomLabel}</span>
                        </label>
                    )}
                </>
            )}
        </div>
    );
}
