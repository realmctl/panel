<x-filament-panels::page>
    <div class="flex flex-col gap-6">

        {{-- Version Banner --}}
        @if($isLatest)
            <div class="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                <div class="flex items-center gap-3">
                    <x-heroicon-o-check-circle class="h-5 w-5 text-green-500" />
                    <p class="text-sm text-green-800 dark:text-green-200">
                        You are running Realm Panel
                        <code class="rounded bg-green-100 px-1.5 py-0.5 font-mono text-xs dark:bg-green-900/50">{{ $version }}</code>
                        — your panel is up to date.
                    </p>
                </div>
            </div>
        @else
            <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <div class="flex items-center gap-3">
                    <x-heroicon-o-exclamation-triangle class="h-5 w-5 text-amber-500" />
                    <p class="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Update available:</strong> version
                        <code class="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">{{ $latestVersion }}</code>
                        is out. You are running
                        <code class="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">{{ $version }}</code>.
                    </p>
                </div>
            </div>
        @endif

        {{-- Stats Cards --}}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {{-- Servers --}}
            <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <div class="flex items-center gap-4">
                    <div class="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-500/10">
                        <x-heroicon-o-cube class="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-950 dark:text-white">{{ number_format($servers) }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Servers</p>
                    </div>
                </div>
                @if($suspendedServers > 0)
                    <p class="mt-3 text-xs text-amber-600 dark:text-amber-400">{{ $suspendedServers }} suspended</p>
                @endif
            </div>

            {{-- Users --}}
            <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <div class="flex items-center gap-4">
                    <div class="rounded-lg bg-green-100 p-2.5 dark:bg-green-500/10">
                        <x-heroicon-o-users class="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-950 dark:text-white">{{ number_format($users) }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Users</p>
                    </div>
                </div>
            </div>

            {{-- Nodes --}}
            <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <div class="flex items-center gap-4">
                    <div class="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-500/10">
                        <x-heroicon-o-server-stack class="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-950 dark:text-white">{{ $activeNodes }} / {{ $nodes }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Nodes</p>
                    </div>
                </div>
                @if($nodes - $activeNodes > 0)
                    <p class="mt-3 text-xs text-amber-600 dark:text-amber-400">{{ $nodes - $activeNodes }} in maintenance</p>
                @endif
            </div>

            {{-- Allocations --}}
            <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <div class="flex items-center gap-4">
                    <div class="rounded-lg bg-purple-100 p-2.5 dark:bg-purple-500/10">
                        <x-heroicon-o-signal class="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-950 dark:text-white">{{ number_format($allocations) }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Allocations</p>
                    </div>
                </div>
                <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">{{ $usedAllocations }} assigned · {{ $allocations - $usedAllocations }} free</p>
            </div>
        </div>

        {{-- Info Cards --}}
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-gray-950 dark:text-white">
                    <x-heroicon-o-cpu-chip class="h-5 w-5 text-gray-400" />
                    System Information
                </h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Panel</p>
                        <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ $version }}</p>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">PHP</p>
                        <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ $phpVersion }}</p>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Laravel</p>
                        <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ $laravelVersion }}</p>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Filament</p>
                        <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ $filamentVersion }}</p>
                    </div>
                </div>
            </div>

            <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-gray-950 dark:text-white">
                    <x-heroicon-o-chart-bar class="h-5 w-5 text-gray-400" />
                    Resource Capacity
                </h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Memory</p>
                        <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ number_format($totalMemory) }} MiB</p>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Disk</p>
                        <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ number_format($totalDisk) }} MiB</p>
                    </div>
                </div>
            </div>
        </div>

    </div>
</x-filament-panels::page>
