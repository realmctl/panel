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
            
            <div class="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                <div class="flex justify-between items-center py-3">
                    <span class="font-medium text-gray-500 dark:text-gray-400">Panel Version</span>
                    <kbd class="px-2 py-1 rounded bg-gray-50 dark:bg-white/5 font-mono text-xs font-semibold text-gray-900 dark:text-white border border-gray-200 dark:border-white/10">{{ $version }}</kbd>
                </div>
                <div class="flex justify-between items-center py-3">
                    <span class="font-medium text-gray-500 dark:text-gray-400">PHP Version</span>
                    <kbd class="px-2 py-1 rounded bg-gray-50 dark:bg-white/5 font-mono text-xs font-semibold text-gray-900 dark:text-white border border-gray-200 dark:border-white/10">{{ $phpVersion }}</kbd>
                </div>
                <div class="flex justify-between items-center py-3">
                    <span class="font-medium text-gray-500 dark:text-gray-400">Laravel Version</span>
                    <kbd class="px-2 py-1 rounded bg-gray-50 dark:bg-white/5 font-mono text-xs font-semibold text-gray-900 dark:text-white border border-gray-200 dark:border-white/10">{{ $laravelVersion }}</kbd>
                </div>
                <div class="flex justify-between items-center py-3">
                    <span class="font-medium text-gray-500 dark:text-gray-400">Suspended Servers</span>
                    <span class="font-mono text-sm font-semibold {{ $suspendedServers > 0 ? 'text-danger-500 font-bold' : 'text-gray-900 dark:text-white' }}">{{ $suspendedServers }}</span>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section icon="heroicon-o-chart-bar" class="transition-all duration-300 hover:shadow-md">
            <x-slot name="heading">Resource Overview</x-slot>

            <div class="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                <div class="flex justify-between items-center py-3">
                    <span class="font-medium text-gray-500 dark:text-gray-400">Total Memory</span>
                    <span class="font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ number_format($totalMemory) }} MiB</span>
                </div>
                <div class="flex justify-between items-center py-3">
                    <span class="font-medium text-gray-500 dark:text-gray-400">Total Disk</span>
                    <span class="font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ number_format($totalDisk) }} MiB</span>
                </div>
                <div class="flex justify-between items-center py-3">
                    <span class="font-medium text-gray-500 dark:text-gray-400">Active Nodes</span>
                    <span class="font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ $activeNodes }}</span>
                </div>
                <div class="flex justify-between items-center py-3">
                    <span class="font-medium text-gray-500 dark:text-gray-400">Maintenance Nodes</span>
                    <span class="font-mono text-sm font-semibold {{ ($nodes - $activeNodes) > 0 ? 'text-warning-500 font-bold' : 'text-gray-900 dark:text-white' }}">{{ $nodes - $activeNodes }}</span>
                </div>
            </div>
        </x-filament::section>
    </x-filament::grid>
</x-filament-panels::page>
