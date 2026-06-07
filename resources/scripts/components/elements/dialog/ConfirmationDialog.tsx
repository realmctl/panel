import React from 'react';
import { Dialog, RenderDialogProps } from './';
import { Button } from '@/components/elements/button/index';
import { Button as UiButton } from '@/components/ui/button';

type ConfirmationProps = Omit<RenderDialogProps, 'description' | 'children'> & {
    children: React.ReactNode;
    confirm?: string | undefined;
    onConfirmed: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export default ({ confirm = 'Okay', children, onConfirmed, appearance = 'default', ...props }: ConfirmationProps) => {
    return (
        <Dialog {...props} appearance={appearance} description={typeof children === 'string' ? children : undefined}>
            {typeof children !== 'string' && children}
            <Dialog.Footer>
                {appearance === 'admin' ? (
                    <>
                        <UiButton type="button" variant="outline" onClick={props.onClose}>
                            Cancel
                        </UiButton>
                        <UiButton type="button" variant="destructive" onClick={onConfirmed}>
                            {confirm}
                        </UiButton>
                    </>
                ) : (
                    <>
                        <Button.Text onClick={props.onClose}>Cancel</Button.Text>
                        <Button.Danger onClick={onConfirmed}>{confirm}</Button.Danger>
                    </>
                )}
            </Dialog.Footer>
        </Dialog>
    );
};
