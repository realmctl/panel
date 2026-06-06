import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import RealmCard from '@/components/elements/realm/RealmCard';
import Button from '@/components/elements/Button';
import { getNodeConfiguration, verifySetupNode } from '@/api/setup/setup';
import { useSetup } from '@/components/setup/SetupContext';
import { getNextStepId, getStepPath } from '@/lib/setupSteps';
import useFlash from '@/plugins/useFlash';
import styles from '@/components/setup/style.module.css';

export default () => {
    const history = useHistory();
    const { status, updateStatus, refresh } = useSetup();
    const { clearAndAddHttpError } = useFlash();
    const [yaml, setYaml] = useState('');
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const nodeId = status?.context.nodeId;

    useEffect(() => {
        let active = true;

        refresh()
            .then((next) => {
                if (!active) {
                    return;
                }

                const resolvedNodeId = next.context.nodeId;

                if (!resolvedNodeId) {
                    setLoadingConfig(false);
                    setError('No node found. Create a node first.');
                    return;
                }

                return getNodeConfiguration(resolvedNodeId).then((data) => {
                    if (active) {
                        setYaml(data.yaml);
                        setError(null);
                    }
                });
            })
            .catch((requestError) => {
                if (!active) {
                    return;
                }

                const message =
                    requestError.response?.data?.error ||
                    requestError.response?.data?.errors?.[0]?.detail ||
                    'Could not load node configuration.';
                setError(message);
            })
            .finally(() => {
                if (active) {
                    setLoadingConfig(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const copyConfiguration = async () => {
        try {
            await navigator.clipboard.writeText(yaml);
        } catch {
            setError('Could not copy to clipboard.');
        }
    };

    const onVerify = () => {
        if (!nodeId) {
            history.push(getStepPath('node'));
            return;
        }

        setVerifying(true);
        setError(null);

        verifySetupNode(nodeId)
            .then((next) => {
                updateStatus(next);
                const nextStep = getNextStepId(next.steps, 'wings') || next.currentStep;
                history.push(getStepPath(nextStep));
            })
            .catch((requestError) => {
                const message =
                    requestError.response?.data?.error ||
                    requestError.response?.data?.errors?.[0]?.detail ||
                    'Could not connect to Wings.';
                setError(message);
            })
            .finally(() => setVerifying(false));
    };

    return (
        <RealmCard title={'Wings'}>
            <p className={styles.stepIntro}>
                Copy this config to <code>/etc/pterodactyl/config.yml</code>, start Wings, then verify.
            </p>

            {loadingConfig ? (
                <p className={styles.stepIntro}>Loading configuration...</p>
            ) : (
                <div className={styles.codeBlock}>
                    <pre>{yaml || 'No configuration available.'}</pre>
                </div>
            )}

            {error && <p className={`${styles.inlineMessage} ${styles.inlineMessageError}`}>{error}</p>}

            <div className={styles.actions}>
                <Button type={'button'} color={'grey'} onClick={copyConfiguration} disabled={!yaml}>
                    Copy
                </Button>
                <Button type={'button'} onClick={onVerify} disabled={verifying || loadingConfig}>
                    {verifying ? 'Verifying...' : 'Verify'}
                </Button>
            </div>
        </RealmCard>
    );
};
