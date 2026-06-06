import React from 'react';
import Switch from '@/components/elements/Switch';
import ConfigurationFieldLabel from '@/components/server/configuration/ConfigurationFieldLabel';
import styles from './style.module.css';

interface Props {
    content: string;
    readOnly?: boolean;
    onChange: (content: string) => void;
}

const parseEulaAccepted = (content: string): boolean => {
    const match = content.match(/^\s*eula\s*=\s*(true|false)\s*$/im);

    return match ? match[1].toLowerCase() === 'true' : false;
};

const formatEulaContent = (accepted: boolean): string =>
    `#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://aka.ms/MinecraftEULA).\n#${new Date().toUTCString()}\neula=${accepted ? 'true' : 'false'}\n`;

export default ({ content, readOnly, onChange }: Props) => {
    const accepted = parseEulaAccepted(content);

    return (
        <div className={styles.field}>
            <ConfigurationFieldLabel
                label={'Accept Minecraft EULA'}
                description={
                    'You must accept the Minecraft End User License Agreement before the server can start. ' +
                    'Read it at https://aka.ms/MinecraftEULA.'
                }
            />
            <div className={styles.fieldControlRow}>
                <Switch
                    key={content}
                    name={'eula'}
                    defaultChecked={accepted}
                    readOnly={readOnly}
                    onChange={(event) => onChange(formatEulaContent(event.currentTarget.checked))}
                />
            </div>
        </div>
    );
};
