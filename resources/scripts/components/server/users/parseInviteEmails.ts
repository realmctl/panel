export const parseInviteEmails = (raw: string): string[] => {
    const emails = raw
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    return [...new Set(emails)];
};
