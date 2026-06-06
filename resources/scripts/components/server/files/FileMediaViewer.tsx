import React, { useEffect, useState } from 'react';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import { httpErrorToHuman } from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import { MediaKind } from '@/components/server/files/fileMediaUtils';
import { getFileName } from '@/components/server/files/fileEditorUtils';
import styles from './style.module.css';

interface Props {
    uuid: string;
    path: string;
    mediaKind: MediaKind;
}

export default ({ uuid, path, mediaKind }: Props) => {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUrl = () => {
        setLoading(true);
        setError(null);

        getFileDownloadUrl(uuid, path)
            .then((downloadUrl) => setUrl(downloadUrl))
            .catch((err) => setError(httpErrorToHuman(err)))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUrl();
    }, [path, uuid]);

    if (loading) {
        return (
            <div className={styles.media_viewer}>
                <Spinner size={'large'} />
            </div>
        );
    }

    if (error || !url) {
        return (
            <div className={styles.media_viewer}>
                <p className={styles.media_error}>{error || 'Failed to load media file.'}</p>
                <Button isSecondary onClick={loadUrl}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className={styles.media_viewer}>
            <div className={styles.media_viewer_inner}>
                <p className={styles.media_filename}>{getFileName(path)}</p>
                {mediaKind === 'video' ? (
                    <video className={styles.media_video} src={url} controls playsInline preload={'metadata'}>
                        Your browser does not support video playback.
                    </video>
                ) : (
                    <audio className={styles.media_audio} src={url} controls preload={'metadata'}>
                        Your browser does not support audio playback.
                    </audio>
                )}
            </div>
        </div>
    );
};
