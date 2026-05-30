<?php

namespace Pterodactyl\Tests\Unit\Http\Middleware;

use Mockery as m;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\Response;
use Illuminate\Http\Request;
use Pterodactyl\Events\Auth\FailedCaptcha;
use Pterodactyl\Http\Middleware\VerifyCaptcha;
use Pterodactyl\Services\Captcha\CaptchaVerificationService;
use Pterodactyl\Tests\TestCase;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Events\Dispatcher;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VerifyCaptchaTest extends TestCase
{
    private Repository $config;
    private Dispatcher $dispatcher;
    private Client $client;

    public function setUp(): void
    {
        parent::setUp();

        $this->config = m::mock(Repository::class);
        $this->dispatcher = m::mock(Dispatcher::class);
        $this->client = m::mock(Client::class);
    }

    /**
     * Test that requests pass through when CAPTCHA is disabled (provider = none).
     */
    public function test_disabled_captcha_passes_through(): void
    {
        $this->config->shouldReceive('get')->with('captcha.provider', 'none')->andReturn('none');

        $service = new CaptchaVerificationService($this->config, $this->client);
        $middleware = new VerifyCaptcha($this->dispatcher, $service);

        $request = Request::create('/auth/login', 'POST');
        $next = function ($req) {
            return new \Illuminate\Http\Response('OK');
        };

        $response = $middleware->handle($request, $next);
        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that a valid reCAPTCHA response passes verification.
     */
    public function test_valid_recaptcha_passes(): void
    {
        $this->config->shouldReceive('get')->with('captcha.provider', 'none')->andReturn('recaptcha');
        $this->config->shouldReceive('get')->with('captcha.recaptcha.domain')->andReturn('https://www.google.com/recaptcha/api/siteverify');
        $this->config->shouldReceive('get')->with('captcha.recaptcha.secret_key')->andReturn('test-secret');
        $this->config->shouldReceive('get')->with('captcha.recaptcha.verify_domain')->andReturn(false);

        $this->client->shouldReceive('post')
            ->once()
            ->with('https://www.google.com/recaptcha/api/siteverify', m::on(function ($params) {
                return $params['form_params']['secret'] === 'test-secret'
                    && $params['form_params']['response'] === 'valid-token';
            }))
            ->andReturn(new Response(200, [], json_encode(['success' => true])));

        $service = new CaptchaVerificationService($this->config, $this->client);
        $middleware = new VerifyCaptcha($this->dispatcher, $service);

        $request = Request::create('/auth/login', 'POST', ['g-recaptcha-response' => 'valid-token']);
        $next = function ($req) {
            return new \Illuminate\Http\Response('OK');
        };

        $response = $middleware->handle($request, $next);
        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that a valid Turnstile response passes verification.
     */
    public function test_valid_turnstile_passes(): void
    {
        $this->config->shouldReceive('get')->with('captcha.provider', 'none')->andReturn('turnstile');
        $this->config->shouldReceive('get')->with('captcha.turnstile.domain')->andReturn('https://challenges.cloudflare.com/turnstile/v0/siteverify');
        $this->config->shouldReceive('get')->with('captcha.turnstile.secret_key')->andReturn('turnstile-secret');

        $this->client->shouldReceive('post')
            ->once()
            ->with('https://challenges.cloudflare.com/turnstile/v0/siteverify', m::on(function ($params) {
                return $params['form_params']['secret'] === 'turnstile-secret'
                    && $params['form_params']['response'] === 'valid-turnstile-token';
            }))
            ->andReturn(new Response(200, [], json_encode(['success' => true])));

        $service = new CaptchaVerificationService($this->config, $this->client);
        $middleware = new VerifyCaptcha($this->dispatcher, $service);

        $request = Request::create('/auth/login', 'POST', ['cf-turnstile-response' => 'valid-turnstile-token']);
        $next = function ($req) {
            return new \Illuminate\Http\Response('OK');
        };

        $response = $middleware->handle($request, $next);
        $this->assertEquals('OK', $response->getContent());
    }

    /**
     * Test that a failed reCAPTCHA response throws an exception.
     */
    public function test_failed_recaptcha_throws_exception(): void
    {
        $this->config->shouldReceive('get')->with('captcha.provider', 'none')->andReturn('recaptcha');
        $this->config->shouldReceive('get')->with('captcha.recaptcha.domain')->andReturn('https://www.google.com/recaptcha/api/siteverify');
        $this->config->shouldReceive('get')->with('captcha.recaptcha.secret_key')->andReturn('test-secret');

        $this->client->shouldReceive('post')
            ->once()
            ->andReturn(new Response(200, [], json_encode(['success' => false])));

        $this->dispatcher->shouldReceive('dispatch')->once()->with(m::type(FailedCaptcha::class));

        $service = new CaptchaVerificationService($this->config, $this->client);
        $middleware = new VerifyCaptcha($this->dispatcher, $service);

        $request = Request::create('/auth/login', 'POST', ['g-recaptcha-response' => 'invalid-token']);
        $next = function ($req) {
            return new \Illuminate\Http\Response('OK');
        };

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Failed to validate CAPTCHA data.');

        $middleware->handle($request, $next);
    }

    /**
     * Test that a failed Turnstile response throws an exception.
     */
    public function test_failed_turnstile_throws_exception(): void
    {
        $this->config->shouldReceive('get')->with('captcha.provider', 'none')->andReturn('turnstile');
        $this->config->shouldReceive('get')->with('captcha.turnstile.domain')->andReturn('https://challenges.cloudflare.com/turnstile/v0/siteverify');
        $this->config->shouldReceive('get')->with('captcha.turnstile.secret_key')->andReturn('turnstile-secret');

        $this->client->shouldReceive('post')
            ->once()
            ->andReturn(new Response(200, [], json_encode(['success' => false])));

        $this->dispatcher->shouldReceive('dispatch')->once()->with(m::type(FailedCaptcha::class));

        $service = new CaptchaVerificationService($this->config, $this->client);
        $middleware = new VerifyCaptcha($this->dispatcher, $service);

        $request = Request::create('/auth/login', 'POST', ['cf-turnstile-response' => 'invalid-token']);
        $next = function ($req) {
            return new \Illuminate\Http\Response('OK');
        };

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Failed to validate CAPTCHA data.');

        $middleware->handle($request, $next);
    }

    /**
     * Test that a missing CAPTCHA token when provider is enabled throws an exception.
     */
    public function test_missing_token_with_recaptcha_enabled_throws_exception(): void
    {
        $this->config->shouldReceive('get')->with('captcha.provider', 'none')->andReturn('recaptcha');

        $this->dispatcher->shouldReceive('dispatch')->once()->with(m::type(FailedCaptcha::class));

        $service = new CaptchaVerificationService($this->config, $this->client);
        $middleware = new VerifyCaptcha($this->dispatcher, $service);

        $request = Request::create('/auth/login', 'POST', []);
        $next = function ($req) {
            return new \Illuminate\Http\Response('OK');
        };

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Failed to validate CAPTCHA data.');

        $middleware->handle($request, $next);
    }

    /**
     * Test that a missing Turnstile token when provider is turnstile throws an exception.
     */
    public function test_missing_token_with_turnstile_enabled_throws_exception(): void
    {
        $this->config->shouldReceive('get')->with('captcha.provider', 'none')->andReturn('turnstile');

        $this->dispatcher->shouldReceive('dispatch')->once()->with(m::type(FailedCaptcha::class));

        $service = new CaptchaVerificationService($this->config, $this->client);
        $middleware = new VerifyCaptcha($this->dispatcher, $service);

        $request = Request::create('/auth/login', 'POST', []);
        $next = function ($req) {
            return new \Illuminate\Http\Response('OK');
        };

        $this->expectException(HttpException::class);
        $this->expectExceptionMessage('Failed to validate CAPTCHA data.');

        $middleware->handle($request, $next);
    }

    /**
     * Test that an unknown provider is treated as disabled (passes through).
     */
    public function test_unknown_provider_passes_through(): void
    {
        $this->config->shouldReceive('get')->with('captcha.provider', 'none')->andReturn('unknown_provider');

        $service = new CaptchaVerificationService($this->config, $this->client);
        $middleware = new VerifyCaptcha($this->dispatcher, $service);

        $request = Request::create('/auth/login', 'POST');
        $next = function ($req) {
            return new \Illuminate\Http\Response('OK');
        };

        $response = $middleware->handle($request, $next);
        $this->assertEquals('OK', $response->getContent());
    }
}
