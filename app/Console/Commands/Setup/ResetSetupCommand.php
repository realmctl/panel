<?php

namespace Realm\Console\Commands\Setup;

use Illuminate\Console\Command;
use Realm\Services\Setup\PanelSetupService;

class ResetSetupCommand extends Command
{
    protected $signature = 'p:setup:reset
                            {--restore : Mark setup as complete and exit testing mode}
                            {--force : Allow running in production}';

    protected $description = 'Reset the setup wizard so it can be tested on an already configured panel.';

    public function __construct(private PanelSetupService $setupService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        if (app()->environment('production') && !$this->option('force')) {
            $this->error('Refusing to reset setup in production. Pass --force if you are sure.');

            return self::FAILURE;
        }

        if ($this->option('restore')) {
            $this->setupService->restoreAfterTesting();
            $this->info('Setup wizard marked as complete. Testing mode disabled.');

            return self::SUCCESS;
        }

        $this->setupService->resetForTesting();

        $this->info('Setup wizard reset for testing.');
        $this->line('Open your panel and visit <fg=cyan>/setup/welcome</> to walk through the wizard.');
        $this->line('When finished testing, run <fg=cyan>php artisan p:setup:reset --restore</>.');

        return self::SUCCESS;
    }
}
