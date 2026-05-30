<x-filament-panels::page>
    {{-- Version Banner --}}
    @if($isLatest)
        <x-filament::section icon="heroicon-o-check-circle" icon-color="success" class="transition-all duration-300 hover:shadow-sm">
            <x-slot name="heading">Up to Date</x-slot>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                You are running Realm Panel <code class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">{{ $version }}</code>. Your panel is up to date!
            </p>
        </x-filament::section>
    @else
        <x-filament::section icon="heroicon-o-exclamation-triangle" icon-color="warning" class="transition-all duration-300 hover:shadow-sm">
            <x-slot name="heading">Update Available</x-slot>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                Your panel is <strong>not up to date</strong>. The latest version is
                <code class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">{{ $latestVersion }}</code>
                and you are running
                <code class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">{{ $version }}</code>.
            </p>
        </x-filament::section>
    @endif

    {{-- Stats Grid --}}
    <x-filament::grid cols="2" md="4" class="gap-4 lg:gap-6">
        <x-filament::section class="transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div class="flex items-center gap-x-4">
                <div class="flex-shrink-0 rounded-xl bg-primary-50 p-3 dark:bg-primary-500/10 transition-transform duration-300 hover:scale-110">
                    <x-heroicon-o-cube class="h-6 w-6 text-primary-500" />
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Servers</p>
                    <p class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mt-0.5">{{ number_format($servers) }}</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section class="transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div class="flex items-center gap-x-4">
                <div class="flex-shrink-0 rounded-xl bg-success-50 p-3 dark:bg-success-500/10 transition-transform duration-300 hover:scale-110">
                    <x-heroicon-o-users class="h-6 w-6 text-success-500" />
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Users</p>
                    <p class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mt-0.5">{{ number_format($users) }}</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section class="transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div class="flex items-center gap-x-4">
                <div class="flex-shrink-0 rounded-xl bg-warning-50 p-3 dark:bg-warning-500/10 transition-transform duration-300 hover:scale-110">
                    <x-heroicon-o-server-stack class="h-6 w-6 text-warning-500" />
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Nodes</p>
                    <p class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mt-0.5">{{ $activeNodes }} / {{ $nodes }}</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section class="transition-all duration-300 hover:shadow-md hover:-translate-y-1">
            <div class="flex items-center gap-x-4">
                <div class="flex-shrink-0 rounded-xl bg-info-50 p-3 dark:bg-info-500/10 transition-transform duration-300 hover:scale-110">
                    <x-heroicon-o-signal class="h-6 w-6 text-info-500" />
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Allocations</p>
                    <p class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mt-0.5">{{ number_format($allocations) }}</p>
                </div>
            </div>
        </x-filament::section>
    </x-filament::grid>

    {{-- Info Cards --}}
    <x-filament::grid cols="1" md="2" class="gap-4 lg:gap-6">
        <x-filament::section icon="heroicon-o-information-circle" class="transition-all duration-300 hover:shadow-md">
            <x-slot name="heading">System Information</x-slot>
            <dl class="grid grid-cols-2 gap-3.5">
                <div class="rounded-xl bg-gray-50/50 p-3.5 dark:bg-white/5 border border-gray-100 dark:border-white/10 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-500/30">
                    <dt class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Panel Version</dt>
                    <dd class="mt-1.5 font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ $version }}</dd>
                </div>
                <div class="rounded-xl bg-gray-50/50 p-3.5 dark:bg-white/5 border border-gray-100 dark:border-white/10 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-500/30">
                    <dt class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">PHP Version</dt>
                    <dd class="mt-1.5 font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ $phpVersion }}</dd>
                </div>
                <div class="rounded-xl bg-gray-50/50 p-3.5 dark:bg-white/5 border border-gray-100 dark:border-white/10 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-500/30">
                    <dt class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Laravel</dt>
                    <dd class="mt-1.5 font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ $laravelVersion }}</dd>
                </div>
                <div class="rounded-xl bg-gray-50/50 p-3.5 dark:bg-white/5 border border-gray-100 dark:border-white/10 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-500/30">
                    <dt class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Suspended</dt>
                    <dd class="mt-1.5 font-mono text-sm font-semibold {{ $suspendedServers > 0 ? 'text-danger-500 font-bold' : 'text-gray-900 dark:text-white' }}">{{ $suspendedServers }}</dd>
                </div>
            </dl>
        </x-filament::section>

        <x-filament::section icon="heroicon-o-chart-bar" class="transition-all duration-300 hover:shadow-md">
            <x-slot name="heading">Resource Overview</x-slot>
            <dl class="grid grid-cols-2 gap-3.5">
                <div class="rounded-xl bg-gray-50/50 p-3.5 dark:bg-white/5 border border-gray-100 dark:border-white/10 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-500/30">
                    <dt class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Memory</dt>
                    <dd class="mt-1.5 font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ number_format($totalMemory) }} MiB</dd>
                </div>
                <div class="rounded-xl bg-gray-50/50 p-3.5 dark:bg-white/5 border border-gray-200 dark:border-white/10 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-500/30">
                    <dt class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Disk</dt>
                    <dd class="mt-1.5 font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ number_format($totalDisk) }} MiB</dd>
                </div>
                <div class="rounded-xl bg-gray-50/50 p-3.5 dark:bg-white/5 border border-gray-200 dark:border-white/10 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-500/30">
                    <dt class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Nodes</dt>
                    <dd class="mt-1.5 font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ $activeNodes }}</dd>
                </div>
                <div class="rounded-xl bg-gray-50/50 p-3.5 dark:bg-white/5 border border-gray-200 dark:border-white/10 transition-all duration-300 hover:border-primary-500/30 dark:hover:border-primary-500/30">
                    <dt class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Maintenance</dt>
                    <dd class="mt-1.5 font-mono text-sm font-semibold {{ ($nodes - $activeNodes) > 0 ? 'text-warning-500 font-bold' : 'text-gray-900 dark:text-white' }}">{{ $nodes - $activeNodes }}</dd>
                </div>
            </dl>
        </x-filament::section>
    </x-filament::grid>
</x-filament-panels::page>
