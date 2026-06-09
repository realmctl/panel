import React, { useEffect } from 'react';

interface Props {
    title?: string;
    description?: string;
    children: React.ReactNode;
}

export default ({ title, description, children }: Props) => {
    useEffect(() => {
        if (title) {
            document.title = `${title} · Admin`;
        }
    }, [title]);

    return (
        <div className="w-full">
            {(title || description) && (
                <div className="mb-8">
                    {title && <h1 className="text-2xl font-header font-semibold text-foreground">{title}</h1>}
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
};
