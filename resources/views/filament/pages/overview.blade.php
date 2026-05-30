<x-filament-panels::page>
    {{-- Version Banner --}}
    @if($isLatest)
        <x-filament::section icon="heroicon-o-check-circle" icon-color="success">
            <x-slot name="heading">Up to Date</x-slot>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                You are running Realm Panel <code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">{{ $version }}</code>. Your panel is up to date!
            </p>
        </x-filament::section>
    @else
        <x-filament::section icon="heroicon-o-exclamation-triangle" icon-color="warning">
            <x-slot name="heading">Update Available</x-slot>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                Your panel is <strong>not up to date</strong>. The latest version is
                <code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">{{ $latestVersion }}</code>
                and you are running
                <code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">{{ $version }}</code>.
            </p>
        </x-filament::section>
    @endif

    {{-- Stats Grid --}}
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <x-filament::section>
            <div class="flex items-center gap-x-3">
                <div class="flex-shrink-0 rounded-lg bg-primary-50 p-3 dark:bg-primary-500/10">
                    <x-heroicon-o-cube class="h-6 w-6 text-primary-500" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Servers</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ number_format($servers) }}</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section>
            <div class="flex items-center gap-x-3">
                <div class="flex-shrink-0 rounded-lg bg-success-50 p-3 dark:bg-success-500/10">
                    <x-heroicon-o-users class="h-6 w-6 text-success-500" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Users</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ number_format($users) }}</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section>
            <div class="flex items-center gap-x-3">
                <div class="flex-shrink-0 rounded-lg bg-warning-50 p-3 dark:bg-warning-500/10">
                    <x-heroicon-o-server-stack class="h-6 w-6 text-warning-500" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Nodes</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ $activeNodes }} / {{ $nodes }}</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section>
            <div class="flex items-center gap-x-3">
                <div class="flex-shrink-0 rounded-lg bg-gray-50 p-3 dark:bg-gray-500/10">
                    <x-heroicon-o-signal class="h-6 w-6 text-gray-500" />
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Allocations</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ number_format($allocations) }}</p>
                </div>
            </div>
        </x-filament::section>
    </div>

    {{-- Info Cards --}}
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <x-filament::section icon="heroicon-o-information-circle">
            <x-slot name="heading">System Information</x-slot>
            <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Panel Version</dt>
                    <dd class="mt-1 font-mono text-sm text-gray-900 dark:text-white">{{ $version }}</dd>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">PHP Version</dt>
                    <dd class="mt-1 font-mono text-sm text-gray-900 dark:text-white">{{ $phpVersion }}</dd>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Laravel</dt>
                    <dd class="mt-1 font-mono text-sm text-gray-900 dark:text-white">{{ $laravelVersion }}</dd>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Suspended Servers</dt>
                    <dd class="mt-1 font-mono text-sm {{ $suspendedServers > 0 ? 'text-danger-500' : 'text-gray-900 dark:text-white' }}">{{ $suspendedServers }}</dd>
                </div>
            </dl>
        </x-filament::section>

        <x-filament::section icon="heroicon-o-chart-bar">
            <x-slot name="heading">Resource Overview</x-slot>
            <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Memory</dt>
                    <dd class="mt-1 font-mono text-sm text-gray-900 dark:text-white">{{ number_format($totalMemory) }} MiB</dd>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Disk</dt>
                    <dd class="mt-1 font-mono text-sm text-gray-900 dark:text-white">{{ number_format($totalDisk) }} MiB</dd>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Active Nodes</dt>
                    <dd class="mt-1 font-mono text-sm text-gray-900 dark:text-white">{{ $activeNodes }}</dd>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Maintenance Nodes</dt>
                    <dd class="mt-1 font-mono text-sm {{ ($nodes - $activeNodes) > 0 ? 'text-warning-500' : 'text-gray-900 dark:text-white' }}">{{ $nodes - $activeNodes }}</dd>
                </div>
            </dl>
        </x-filament::section>
    </div>
</x-filament-panels::page>
