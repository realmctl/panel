import React from 'react';
import { DatabaseHostLocationOption } from '@/api/admin/databases';
import { selectClass } from '@/components/admin-preview/settings/fieldClass';
import { Label } from '@/components/ui/label';

export default ({
    id,
    locations,
    value,
    onChange,
}: {
    id: string;
    locations: DatabaseHostLocationOption[];
    value: number | null;
    onChange: (nodeId: number | null) => void;
}) => (
    <div className="space-y-2">
        <Label htmlFor={id}>Linked node</Label>
        <select
            id={id}
            className={selectClass}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        >
            <option value="">None</option>
            {locations.map((location) => (
                <optgroup key={location.id} label={location.short}>
                    {location.nodes.map((node) => (
                        <option key={node.id} value={node.id}>
                            {node.name}
                        </option>
                    ))}
                </optgroup>
            ))}
        </select>
        <p className="text-xs text-muted-foreground">
            Defaults to this database host when adding a database to a server on the selected node.
        </p>
    </div>
);
