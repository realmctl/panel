import React, { useMemo, useState } from 'react';
import ConfigurationField from '@/components/server/configuration/ConfigurationField';
import RealmTabBar from '@/components/elements/realm/RealmTabBar';
import { MinecraftConfigDefinition } from '@/components/server/configuration/minecraftConfigs';
import {
    PropertiesLine,
    getPropertiesMap,
    setPropertyValue,
} from '@/lib/propertiesFile';
import styles from './style.module.css';

interface Props {
    config: MinecraftConfigDefinition;
    lines: PropertiesLine[];
    readOnly?: boolean;
    onChange: (lines: PropertiesLine[]) => void;
}

export default ({ config, lines, readOnly, onChange }: Props) => {
    const groups = config.groups ?? [];
    const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? 'general');

    const values = useMemo(() => getPropertiesMap(lines), [lines]);
    const schemaKeys = useMemo(() => {
        const keys = new Set<string>();

        for (const group of groups) {
            for (const field of group.fields) {
                keys.add(field.key);
            }
        }

        return keys;
    }, [groups]);

    const extraKeys = useMemo(
        () =>
            Object.keys(values)
                .filter((key) => !schemaKeys.has(key))
                .sort((a, b) => a.localeCompare(b)),
        [schemaKeys, values]
    );

    const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];

    const updateValue = (key: string, value: string) => {
        onChange(setPropertyValue(lines, key, value));
    };

    return (
        <div className={'flex flex-col gap-6'}>
            {groups.length > 1 && (
                <RealmTabBar
                    tabs={groups.map((group) => ({ id: group.id, label: group.label }))}
                    activeTab={activeGroup?.id ?? groups[0].id}
                    onTabChange={setActiveGroupId}
                />
            )}

            {activeGroup && (
                <section>
                    <div className={styles.fieldGrid}>
                        {activeGroup.fields.map((field) => (
                            <ConfigurationField
                                key={field.key}
                                field={field}
                                value={values[field.key] ?? ''}
                                readOnly={readOnly}
                                onChange={(value) => updateValue(field.key, value)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {extraKeys.length > 0 && (
                <section className={styles.advancedSection}>
                    <h3 className={styles.groupTitle}>Additional properties</h3>
                    <div className={styles.fieldGrid}>
                        {extraKeys.map((key) => (
                            <ConfigurationField
                                key={key}
                                field={{ key, label: key, type: 'string' }}
                                value={values[key] ?? ''}
                                readOnly={readOnly}
                                onChange={(value) => updateValue(key, value)}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
