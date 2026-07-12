import React, { memo, useState } from 'react';
import classNames from 'classnames';
import { ServerEggVariable } from '@/api/server/types';
import { usePermissions } from '@/plugins/usePermissions';
import InputSpinner from '@/components/elements/InputSpinner';
import Input from '@/components/elements/Input';
import Switch from '@/components/elements/Switch';
import { debounce } from 'debounce';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import getServerStartup from '@/api/swr/getServerStartup';
import Select from '@/components/elements/Select';
import isEqual from 'react-fast-compare';
import { ServerContext } from '@/state/server';
import RealmCard from '@/components/elements/realm/RealmCard';
import { realmClasses } from '@/lib/realmTokens';

interface Props {
    variable: ServerEggVariable;
}

const VariableBox = ({ variable }: Props) => {
    const FLASH_KEY = `server:startup:${variable.envVariable}`;

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [loading, setLoading] = useState(false);
    const [canEdit] = usePermissions(['startup.update']);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerStartup(uuid);

    const setVariableValue = debounce((value: string) => {
        setLoading(true);
        clearFlashes(FLASH_KEY);

        updateStartupVariable(uuid, variable.envVariable, value)
            .then(([response, invocation]) =>
                mutate(
                    (data) => ({
                        ...data,
                        invocation,
                        variables: (data.variables || []).map((v) =>
                            v.envVariable === response.envVariable ? response : v
                        ),
                    }),
                    false
                )
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ error, key: FLASH_KEY });
            })
            .then(() => setLoading(false));
    }, 500);

    const useSwitch = variable.rules.some(
        (v) => v === 'boolean' || v === 'in:0,1' || v === 'in:1,0' || v === 'in:true,false' || v === 'in:false,true'
    );
    const isStringSwitch = variable.rules.some((v) => v === 'string');
    const selectValues = variable.rules.find((v) => v.startsWith('in:'))?.split(',') || [];

    return (
        <RealmCard
            rounded={'md'}
            border={'soft'}
            header={
                <div className={'flex items-center justify-between gap-3'}>
                    <h2 className={'text-base font-semibold text-neutral-100 m-0'}>{variable.name}</h2>
                    {!variable.isEditable && (
                        <span
                            className={classNames('text-xs px-2 py-0.5 rounded-full flex-shrink-0', realmClasses.badge)}
                        >
                            Read Only
                        </span>
                    )}
                </div>
            }
            headerClassName={'!py-2.5 !bg-realm-card !border-realm-border/50'}
        >
            <FlashMessageRender byKey={FLASH_KEY} className={'mb-3'} />

            <InputSpinner visible={loading}>
                {useSwitch ? (
                    <Switch
                        readOnly={!canEdit || !variable.isEditable}
                        name={variable.envVariable}
                        defaultChecked={isStringSwitch ? variable.serverValue === 'true' : variable.serverValue === '1'}
                        onChange={() => {
                            if (canEdit && variable.isEditable) {
                                if (isStringSwitch) {
                                    setVariableValue(variable.serverValue === 'true' ? 'false' : 'true');
                                } else {
                                    setVariableValue(variable.serverValue === '1' ? '0' : '1');
                                }
                            }
                        }}
                    />
                ) : selectValues.length > 0 ? (
                    <Select
                        onChange={(e) => setVariableValue(e.target.value)}
                        name={variable.envVariable}
                        defaultValue={variable.serverValue ?? variable.defaultValue}
                        disabled={!canEdit || !variable.isEditable}
                    >
                        {selectValues.map((selectValue) => (
                            <option key={selectValue.replace('in:', '')} value={selectValue.replace('in:', '')}>
                                {selectValue.replace('in:', '')}
                            </option>
                        ))}
                    </Select>
                ) : (
                    <Input
                        onKeyUp={(e) => {
                            if (canEdit && variable.isEditable) {
                                setVariableValue(e.currentTarget.value);
                            }
                        }}
                        readOnly={!canEdit || !variable.isEditable}
                        name={variable.envVariable}
                        defaultValue={variable.serverValue ?? ''}
                        placeholder={variable.defaultValue}
                    />
                )}
            </InputSpinner>

            {variable.description ? <p className={'text-xs text-neutral-500 mt-3'}>{variable.description}</p> : null}
        </RealmCard>
    );
};

export default memo(VariableBox, isEqual);
