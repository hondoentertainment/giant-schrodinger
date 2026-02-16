import React, { useState } from 'react';
import {
    shareToTwitter,
    shareToFacebook,
    shareToLinkedIn,
    copyShareLink,
    downloadFusionImage,
    shareViaWebShare,
} from '../services/socialShare';

const ICON_SIZE = 20;

function TwitterIcon() {
    return (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

function LinkedInIcon() {
    return (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );
}

function CopyIcon() {
    return (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
    );
}

function DownloadIcon() {
    return (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function ShareIcon() {
    return (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

const BUTTON_BASE =
    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed';

export default function SocialShareButtons({ shareData, imageUrl, onToast }) {
    const [copied, setCopied] = useState(false);
    const supportsWebShare = typeof navigator !== 'undefined' && !!navigator.share;

    const handleTwitter = () => {
        shareToTwitter(shareData);
    };

    const handleFacebook = () => {
        shareToFacebook(shareData);
    };

    const handleLinkedIn = () => {
        shareToLinkedIn(shareData);
    };

    const handleCopy = async () => {
        const result = await copyShareLink(shareData);
        if (result.success) {
            setCopied(true);
            onToast?.('success', result.message);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleDownload = () => {
        if (!imageUrl) return;
        downloadFusionImage(imageUrl);
        onToast?.('success', 'Image downloaded!');
    };

    const handleWebShare = async () => {
        const result = await shareViaWebShare({ ...shareData, imageUrl });
        if (result && !result.success && result.error) {
            onToast?.('warn', 'Share failed — try another option');
        }
    };

    return (
        <div className="w-full">
            <p className="text-white/40 text-xs uppercase tracking-widest text-center mb-3">
                Share your result
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Twitter / X */}
                <button
                    onClick={handleTwitter}
                    className={`${BUTTON_BASE} bg-white/5 hover:bg-sky-500/20 text-white/80 hover:text-sky-400`}
                    title="Share on X (Twitter)"
                >
                    <TwitterIcon />
                    <span className="hidden sm:inline">X</span>
                </button>

                {/* Facebook */}
                <button
                    onClick={handleFacebook}
                    className={`${BUTTON_BASE} bg-white/5 hover:bg-blue-600/20 text-white/80 hover:text-blue-400`}
                    title="Share on Facebook"
                >
                    <FacebookIcon />
                    <span className="hidden sm:inline">Facebook</span>
                </button>

                {/* LinkedIn */}
                <button
                    onClick={handleLinkedIn}
                    className={`${BUTTON_BASE} bg-white/5 hover:bg-blue-500/20 text-white/80 hover:text-blue-300`}
                    title="Share on LinkedIn"
                >
                    <LinkedInIcon />
                    <span className="hidden sm:inline">LinkedIn</span>
                </button>

                {/* Copy link */}
                <button
                    onClick={handleCopy}
                    className={`${BUTTON_BASE} ${copied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 text-white/80'}`}
                    title={copied ? 'Copied!' : 'Copy share text'}
                >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                {/* Download image */}
                {imageUrl && (
                    <button
                        onClick={handleDownload}
                        className={`${BUTTON_BASE} bg-white/5 hover:bg-purple-500/20 text-white/80 hover:text-purple-400`}
                        title="Download fusion image"
                    >
                        <DownloadIcon />
                        <span className="hidden sm:inline">Save</span>
                    </button>
                )}

                {/* Native share (mobile) */}
                {supportsWebShare && (
                    <button
                        onClick={handleWebShare}
                        className={`${BUTTON_BASE} bg-white/5 hover:bg-pink-500/20 text-white/80 hover:text-pink-400`}
                        title="Share via device"
                    >
                        <ShareIcon />
                        <span className="hidden sm:inline">Share</span>
                    </button>
                )}
            </div>
        </div>
    );
}
