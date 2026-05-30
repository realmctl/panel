<x-filament-panels::page>
    <x-filament::tabs>
        <x-filament::tabs.item
            :active="$activeTab === 'general'"
            wire:click="$set('activeTab', 'general')"
        >
            General
        </x-filament::tabs.item>

        <x-filament::tabs.item
            :active="$activeTab === 'mail'"
            wire:click="$set('activeTab', 'mail')"
        >
            Mail
        </x-filament::tabs.item>

        <x-filament::tabs.item
            :active="$activeTab === 'security'"
            wire:click="$set('activeTab', 'security')"
        >
            Security
        </x-filament::tabs.item>
    </x-filament::tabs>

    <div class="mt-6">
        @if($activeTab === 'general')
            <form wire:submit="saveGeneral">
                {{ $this->generalForm }}
                <div class="mt-4 flex justify-end">
                    <x-filament::button type="submit">
                        Save General
                    </x-filament::button>
                </div>
            </form>
        @elseif($activeTab === 'mail')
            <form wire:submit="saveMail">
                {{ $this->mailForm }}
                <div class="mt-4 flex justify-end gap-2">
                    <x-filament::button color="success" wire:click="testMail" type="button">
                        Send Test
                    </x-filament::button>
                    <x-filament::button type="submit">
                        Save Mail
                    </x-filament::button>
                </div>
            </form>
        @elseif($activeTab === 'security')
            <form wire:submit="saveSecurity">
                {{ $this->securityForm }}
                <div class="mt-4 flex justify-end">
                    <x-filament::button type="submit">
                        Save Security
                    </x-filament::button>
                </div>
            </form>
        @endif
    </div>
</x-filament-panels::page>
