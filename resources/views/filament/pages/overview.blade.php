<x-filament-panels::page>
    {{-- Version Banner --}}
    @if($isLatest)
        <x-filament::section icon="heroicon-o-check-circle" icon-color="success" compact>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                You are running Realm Panel
                <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-white/5">{{ $version }}</code>
                — your panel is up to date.
            </p>
        </x-filament::section>
    @else
        <x-filament::section icon="heroicon-o-exclamation-triangle" icon-color="warning" compact>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                <strong>Update available:</strong> version
                <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-white/5">{{ $latestVersion }}</code>
                is out. You are running
                <code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-white/5">{{ $version }}</code>.
            </p>
        </x-filament::section>
    @endif

    {{-- System Info --}}
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <x-filament::section icon="heroicon-o-cpu-chip" heading="System Information">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Panel Version</p>
                    <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ $version }}</p>
                </div>
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">PHP</p>
                    <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ $phpVersion }}</p>
                </div>
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Laravel</p>
                    <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ $laravelVersion }}</p>
                </div>
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Filament</p>
                    <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ \Composer\InstalledVersions::getPrettyVersion('filament/filament') }}</p>
                </div>
            </div>
        </x-filament::section>

        <x-filament::section icon="heroicon-o-chart-bar" heading="Resource Capacity">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Memory</p>
                    <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ number_format($totalMemory) }} MiB</p>
                </div>
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Disk</p>
                    <p class="mt-1 font-mono text-sm text-gray-950 dark:text-white">{{ number_format($totalDisk) }} MiB</p>
                </div>
            </div>
        </x-filament::section>
    </div>
</x-filament-panels::page>
