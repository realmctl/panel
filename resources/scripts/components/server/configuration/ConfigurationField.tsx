import React from 'react';
import Input from '@/components/elements/Input';
import Switch from '@/components/elements/Switch';
import Select from '@/components/elements/Select';
import ConfigurationFieldLabel from '@/components/server/configuration/ConfigurationFieldLabel';
import { ConfigFieldDefinition } from '@/components/server/configuration/minecraftConfigs';
import styles from './style.module.css';

interface Props {
    field: ConfigFieldDefinition;
    value: string;
    readOnly?: boolean;
    onChange: (value: string) => void;
}

export default ({ field, value, readOnly, onChange }: Props) => {
    const inputId = `config-${field.key}`;

    if (field.type === 'boolean') {
        return (
            <div className={styles.field}>
                <ConfigurationFieldLabel label={field.label} description={field.description} htmlFor={inputId} />
                <div className={styles.fieldControlRow}>
                    <Switch
                        key={`${field.key}-${value}`}
                        name={field.key}
                        defaultChecked={value.trim().toLowerCase() === 'true'}
                        readOnly={readOnly}
                        onChange={(event) => onChange(event.currentTarget.checked ? 'true' : 'false')}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.field}>
            <ConfigurationFieldLabel label={field.label} description={field.description} htmlFor={inputId} />
            <div className={styles.fieldControlRow}>
                {field.type === 'select' ? (
                    <Select
                        id={inputId}
                        className={styles.fieldSelect}
                        disabled={readOnly}
                        value={value}
                        onChange={(event) => onChange(event.currentTarget.value)}
                    >
                        {(field.options ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                ) : (
                    <Input
                        id={inputId}
                        className={styles.fieldInput}
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={value}
                        readOnly={readOnly}
                        min={field.min}
                        max={field.max}
                        onChange={(event) => onChange(event.currentTarget.value)}
                    />
                )}
            </div>
        </div>
    );
};
