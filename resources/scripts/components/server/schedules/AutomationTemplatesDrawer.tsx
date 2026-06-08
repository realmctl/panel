import React from 'react';
import tw from 'twin.macro';
import Drawer from '@/components/elements/Drawer';
import { Button } from '@/components/elements/button/index';
import { AUTOMATION_TEMPLATES } from '@/components/server/schedules/automationTemplates';

interface Props {
    visible: boolean;
    onDismissed: () => void;
    onSelect: (index: number) => void;
}

const AutomationTemplatesDrawer = ({ visible, onDismissed, onSelect }: Props) => {
    return (
        <Drawer
            visible={visible}
            onDismissed={onDismissed}
            title={'Automation templates'}
            subtitle={'Start from a preset and customize it after creation.'}
            width={'32rem'}
        >
            <div css={tw`space-y-3`}>
                {AUTOMATION_TEMPLATES.map((item, index) => (
                    <button
                        key={item.label}
                        type={'button'}
                        css={tw`w-full text-left p-4 rounded bg-neutral-700 hover:bg-neutral-600 transition-colors duration-150 border-0 cursor-pointer`}
                        onClick={() => {
                            onSelect(index);
                            onDismissed();
                        }}
                    >
                        <p css={tw`text-neutral-100 font-medium`}>{item.label}</p>
                        <p css={tw`text-neutral-400 text-sm mt-1`}>{item.description}</p>
                    </button>
                ))}
            </div>
            <div css={tw`mt-6 pt-4 border-t border-realm-border flex justify-end`}>
                <Button.Text size={Button.Sizes.Small} type={'button'} onClick={onDismissed}>
                    Cancel
                </Button.Text>
            </div>
        </Drawer>
    );
};

export default AutomationTemplatesDrawer;
