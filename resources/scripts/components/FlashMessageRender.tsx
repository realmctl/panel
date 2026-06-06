type Props = Readonly<{
    byKey?: string;
    className?: string;
    css?: unknown;
    key?: string;
}>;

/**
 * Inline flash rendering is handled globally by <FlashToast /> in App.tsx.
 * This component is kept so existing call sites continue to compile without layout changes.
 */
const FlashMessageRender = (_props: Props) => null;

export default FlashMessageRender;
