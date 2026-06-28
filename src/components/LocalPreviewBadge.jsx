import React from 'react';
import { t } from '../lib/i18n';



/** Badge for features that only persist locally until cloud sync ships. */

export function LocalPreviewBadge({ className = '' }) {

    return (

        <span

            className={`inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200 ${className}`}

            title={t('lobby.localPreviewTitle')}

        >

            {t('lobby.localPreview')}

        </span>

    );

}


