<?php

namespace Pterodactyl\Http\ViewComposers;

use Illuminate\View\View;
use Pterodactyl\Models\ActivityLog;

class AdminNotificationComposer
{
    /**
     * Bind recent critical activity logs to the admin notifications dropdown.
     */
    public function compose(View $view): void
    {
        $activities = ActivityLog::query()
            ->with('actor')
            ->whereIn('event', [
                'server:create',
                'server:delete',
                'server:reinstall',
                'server:suspend',
                'server:unsuspend',
                'user:create',
                'user:delete',
                'server:backup.create',
                'server:backup.restore',
                'server:transfer',
                'auth:login',
                'auth:failed',
            ])
            ->orderByDesc('timestamp')
            ->limit(5)
            ->get();

        $view->with('adminActivities', $activities);
    }
}
