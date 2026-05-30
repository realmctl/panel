<?php

namespace Pterodactyl\Http\Middleware;

/**
 * @deprecated Use VerifyCaptcha instead. Kept for backward compatibility with
 *             existing route middleware alias 'recaptcha'.
 */
class VerifyReCaptcha extends VerifyCaptcha
{
}
