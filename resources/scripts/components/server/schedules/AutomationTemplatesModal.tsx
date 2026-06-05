import React, { useContext } from 'react';
import tw from 'twin.macro';
import asModal from '@/hoc/asModal';
import ModalContext from '@/context/ModalContext';
import { Button } from '@/components/elements/button/index';
import { AUTOMATION_TEMPLATES } from '@/components/server/schedules/automationTemplates';

interface Props {
    onSelect: (index: number) => void;
}

const AutomationTemplatesModal = ({ onSelect }: Props) => {
    const { dismiss } = useContext(ModalContext);

    return (
        <div>
            <h3 css={tw`text-2xl mb-6`}>Automation templates</h3>
            <p css={tw`text-neutral-400 text-sm mb-6`}>
                Start from a preset and customize it after creation.
            </p>
            <div css={tw`space-y-3`}>
                {AUTOMATION_TEMPLATES.map((item, index) => (
                    <button
                        key={item.label}
                        type={'button'}
                        css={tw`w-full text-left p-4 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors duration-150 border-0 cursor-pointer`}
                        onClick={() => {
                            onSelect(index);
                            dismiss();
                        }}
                    >
                        <p css={tw`text-neutral-100 font-medium`}>{item.label}</p>
                        <p css={tw`text-neutral-400 text-sm mt-1`}>{item.description}</p>
                    </button>
                ))}
            </div>
            <div css={tw`mt-6 text-right`}>
                <Button.Text onClick={() => dismiss()}>Cancel</Button.Text>
            </div>
        </div>
    );
};

export default asModal<Props>({ top: false })(AutomationTemplatesModal);
