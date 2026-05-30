<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Events\Auth\FailedCaptcha;
use Illuminate\Contracts\Events\Dispatcher;
use Pterodactyl\Services\Captcha\CaptchaVerificationService;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VerifyCaptcha
{
    public function __construct(private Dispatcher $dispatcher, private CaptchaVerificationService $captcha)
    {
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, \Closure $next): mixed
    {
        if (!$this->captcha->isEnabled()) {
            return $next($request);
        }

        if ($this->captcha->verify($request)) {
            return $next($request);
        }

        $this->dispatcher->dispatch(
            new FailedCaptcha($request->ip(), $request->getHost())
        );

        throw new HttpException(
            Response::HTTP_BAD_REQUEST,
            'Failed to validate CAPTCHA data.'
        );
    }
}
