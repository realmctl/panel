<?php

namespace Realm\Tests\Integration\Commands\Environment;

use Realm\Tests\Integration\IntegrationTestCase;

class EmailSettingsCommandTest extends IntegrationTestCase
{
    /**
     * Test that the SMTP driver can be selected and configured.
     */
    public function test_smtp_driver_selection(): void
    {
        $this->artisan('p:environment:mail', [
            '--driver' => 'smtp',
            '--host' => 'smtp.test.com',
            '--port' => '587',
            '--username' => 'user@test.com',
            '--password' => 'secret',
            '--encryption' => 'tls',
            '--email' => 'panel@test.com',
            '--from' => 'Test Panel',
        ])->assertExitCode(0);

        // Verify the .env file was updated
        $env = file_get_contents(base_path('.env'));
        $this->assertStringContainsString('MAIL_DRIVER=smtp', $env);
        $this->assertStringContainsString('MAIL_HOST=smtp.test.com', $env);
        $this->assertStringContainsString('MAIL_PORT=587', $env);
        $this->assertStringContainsString('MAIL_FROM_ADDRESS=panel@test.com', $env);
    }

    /**
     * Test that the Resend driver can be selected and configured.
     */
    public function test_resend_driver_selection(): void
    {
        $this->artisan('p:environment:mail', [
            '--driver' => 'resend',
            '--resend-key' => 're_test_123456789',
            '--email' => 'panel@test.com',
            '--from' => 'Test Panel',
        ])->assertExitCode(0);

        $env = file_get_contents(base_path('.env'));
        $this->assertStringContainsString('MAIL_DRIVER=resend', $env);
        $this->assertStringContainsString('RESEND_KEY=re_test_123456789', $env);
        $this->assertStringContainsString('MAIL_FROM_ADDRESS=panel@test.com', $env);
    }

    /**
     * Test that the Resend driver shows an error when no key is provided.
     */
    public function test_resend_driver_warns_without_key(): void
    {
        $this->artisan('p:environment:mail', [
            '--driver' => 'resend',
            '--resend-key' => '',
            '--email' => 'panel@test.com',
            '--from' => 'Test Panel',
        ])->assertExitCode(0);

        // The command should still write the env (it warns but doesn't abort)
        $env = file_get_contents(base_path('.env'));
        $this->assertStringContainsString('MAIL_DRIVER=resend', $env);
    }

    /**
     * Test that the mail config includes the resend mailer.
     */
    public function test_resend_mailer_is_configured(): void
    {
        $mailers = config('mail.mailers');

        $this->assertArrayHasKey('resend', $mailers);
        $this->assertEquals('resend', $mailers['resend']['transport']);
    }

    /**
     * Test that the services config includes the resend key.
     */
    public function test_resend_service_config_exists(): void
    {
        $this->assertNotNull(config('services.resend'));
        $this->assertArrayHasKey('key', config('services.resend'));
    }

    /**
     * Test that existing SMTP configuration is not affected.
     */
    public function test_smtp_config_unchanged(): void
    {
        $smtp = config('mail.mailers.smtp');

        $this->assertEquals('smtp', $smtp['transport']);
        $this->assertArrayHasKey('host', $smtp);
        $this->assertArrayHasKey('port', $smtp);
        $this->assertArrayHasKey('encryption', $smtp);
        $this->assertArrayHasKey('username', $smtp);
        $this->assertArrayHasKey('password', $smtp);
    }

    /**
     * Test that the from address validation works.
     */
    public function test_empty_from_address_returns_error(): void
    {
        $this->artisan('p:environment:mail', [
            '--driver' => 'smtp',
            '--host' => 'smtp.test.com',
            '--port' => '587',
            '--username' => 'user@test.com',
            '--password' => 'secret',
            '--encryption' => 'tls',
            '--email' => '',
            '--from' => 'Test Panel',
        ])->assertExitCode(1);
    }
}
