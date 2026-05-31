@auth
    <div class="nav-item dropdown d-none d-md-flex me-3">
        <a href="#" class="nav-link px-0" data-bs-toggle="dropdown" tabindex="-1"
           aria-label="Show notifications" data-bs-auto-close="outside">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
                 viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                 stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"/>
                <path d="M9 17v1a3 3 0 0 0 6 0v-1"/>
            </svg>
            @if(isset($adminActivities) && $adminActivities->count() > 0)
                <span class="badge bg-red"></span>
            @endif
        </a>
        <div class="dropdown-menu dropdown-menu-arrow dropdown-menu-end dropdown-menu-card" style="width: 380px;">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Activity</h3>
                </div>
                <div class="list-group list-group-flush list-group-hoverable" style="max-height: 320px; overflow-y: auto;">
                    @if(isset($adminActivities) && $adminActivities->count() > 0)
                        @foreach($adminActivities as $activity)
                            <div class="list-group-item">
                                <div class="row align-items-center">
                                    <div class="col-auto">
                                        @php
                                            $dotColor = match(true) {
                                                str_contains($activity->event, 'delete') => 'bg-red',
                                                str_contains($activity->event, 'create') => 'bg-green',
                                                str_contains($activity->event, 'failed') => 'bg-red',
                                                str_contains($activity->event, 'suspend') => 'bg-yellow',
                                                default => 'bg-blue',
                                            };
                                        @endphp
                                        <span class="status-dot {{ $dotColor }} d-block"></span>
                                    </div>
                                    <div class="col text-truncate">
                                        <div class="text-body d-block fw-bold">{{ str_replace([':', '.'], ' ', $activity->event) }}</div>
                                        <div class="d-block text-secondary text-truncate mt-n1">
                                            {{ $activity->actor?->username ?? 'System' }} &mdash; {{ $activity->ip }}
                                        </div>
                                    </div>
                                    <div class="col-auto text-secondary">
                                        {{ $activity->timestamp->diffForHumans(null, true, true) }}
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    @else
                        <div class="list-group-item">
                            <div class="text-center text-secondary py-3">
                                <i class="ti ti-bell-off mb-2" style="font-size: 1.5rem;"></i>
                                <p class="mb-0">No recent activity</p>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
@endif
