import React from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import AdminPreviewContent from '@/components/admin-preview/AdminPreviewContent';
import { getAdminPreviewRoute } from '@/routers/adminPreviewRoutes';
import styles from '@/components/admin-preview/style.module.css';

export default () => {
    const { pathname } = useLocation();
    const route = getAdminPreviewRoute(pathname);

    return (
        <AdminPreviewContent
            title={route?.name || 'Section'}
            description={'This section has not been migrated to the new admin interface yet.'}
        >
            {route?.legacyPath && (
                <a href={route.legacyPath} className={styles.inlineLink}>
                    <FontAwesomeIcon icon={faExternalLinkAlt} className={styles.footerIcon} />
                    <span>Open in legacy admin</span>
                </a>
            )}
        </AdminPreviewContent>
    );
};
