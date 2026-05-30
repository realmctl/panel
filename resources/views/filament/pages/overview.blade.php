<x-filament-panels::page>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <x-filament::section>
            <div class="text-center">
                <div class="text-3xl font-bold text-primary-500">{{ $servers }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Servers</div>
            </div>
        </x-filament::section>

        <x-filament::section>
            <div class="text-center">
                <div class="text-3xl font-bold text-success-500">{{ $users }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Users</div>
            </div>
        </x-filament::section>

        <x-filament::section>
            <div class="text-center">
                <div class="text-3xl font-bold text-warning-500">{{ $nodes }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Nodes</div>
            </div>
        </x-filament::section>

        <x-filament::section>
            <div class="text-center">
                <div class="text-3xl font-bold text-gray-500">{{ $allocations }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Allocations</div>
            </div>
        </x-filament::section>
    </div>

    <div class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
        <x-filament::section heading="System Information">
            <dl class="grid grid-cols-2 gap-2 text-sm">
                <dt class="text-gray-500 dark:text-gray-400">Panel Version</dt>
                <dd class="font-mono">{{ $version }}</dd>

                <dt class="text-gray-500 dark:text-gray-400">Laravel</dt>
                <dd class="font-mono">{{ $laravelVersion }}</dd>

                <dt class="text-gray-500 dark:text-gray-400">PHP</dt>
                <dd class="font-mono">{{ $phpVersion }}</dd>
            </dl>
        </x-filament::section>

        <x-filament::section heading="Quick Stats">
            <dl class="grid grid-cols-2 gap-2 text-sm">
                <dt class="text-gray-500 dark:text-gray-400">Active Nodes</dt>
                <dd>{{ $activeNodes }} / {{ $nodes }}</dd>

                <dt class="text-gray-500 dark:text-gray-400">Suspended Servers</dt>
                <dd class="{{ $suspendedServers > 0 ? 'text-danger-500' : '' }}">{{ $suspendedServers }}</dd>
            </dl>
        </x-filament::section>
    </div>
</x-filament-panels::page>
