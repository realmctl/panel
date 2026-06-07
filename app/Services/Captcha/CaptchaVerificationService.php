<?php

namespace Realm\Services\Captcha;

use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Contracts\Config\Repository;

class CaptchaVerificationService
{
    public function __construct(private Repository $config, private Client $client)
    {
    }

    /**
     * Determine if CAPTCHA verification is enabled.
     */
    public function isEnabled(): bool
    {
        return $this->getProvider() !== 'none';
    }

    /**
     * Get the configured CAPTCHA provider name.
     */
    public function getProvider(): string
    {
        return $this->config->get('captcha.provider', 'none');
    }

    /**
     * Verify the CAPTCHA response token for the configured provider.
     */
    public function verify(Request $request): bool
    {
        $provider = $this->getProvider();

        return match ($provider) {
            'recaptcha' => $this->verifyRecaptcha($request),
            'turnstile' => $this->verifyTurnstile($request),
            default => true,
        };
    }

    /**
     * Get the request field name that contains the CAPTCHA response token.
     */
    public function getResponseField(): string
    {
        return match ($this->getProvider()) {
            'turnstile' => 'cf-turnstile-response',
            default => 'g-recaptcha-response',
        };
    }

    /**
     * Verify a Google reCAPTCHA response.
     */
    private function verifyRecaptcha(Request $request): bool
    {
        $token = $request->input('g-recaptcha-response');
        if (empty($token)) {
            return false;
        }

        $res = $this->client->post($this->config->get('captcha.recaptcha.domain'), [
            'form_params' => [
                'secret' => $this->config->get('captcha.recaptcha.secret_key'),
                'response' => $token,
            ],
        ]);

        if ($res->getStatusCode() !== 200) {
            return false;
        }

        $result = json_decode($res->getBody());

        if (!$result->success) {
            return false;
        }

        // Optionally verify the domain matches.
        if ($this->config->get('captcha.recaptcha.verify_domain')) {
            $url = parse_url($request->url());

            return ($result->hostname ?? null) === ($url['host'] ?? null);
        }

        return true;
    }

    /**
     * Verify a Cloudflare Turnstile response.
     */
    private function verifyTurnstile(Request $request): bool
    {
        $token = $request->input('cf-turnstile-response');
        if (empty($token)) {
            return false;
        }

        $res = $this->client->post($this->config->get('captcha.turnstile.domain'), [
            'form_params' => [
                'secret' => $this->config->get('captcha.turnstile.secret_key'),
                'response' => $token,
                'remoteip' => $request->ip(),
            ],
        ]);

        if ($res->getStatusCode() !== 200) {
            return false;
        }

        $result = json_decode($res->getBody());

        return $result->success ?? false;
    }
}
