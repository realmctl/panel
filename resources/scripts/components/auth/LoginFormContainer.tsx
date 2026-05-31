import React, { forwardRef } from 'react';
import { Form } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {title && (
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                )}
                <FlashMessageRender className="mt-4 mb-4" />
                <Form {...props} ref={ref} className="mt-6 space-y-4">
                    {props.children}
                </Form>
            </div>
        </div>
    </div>
));
