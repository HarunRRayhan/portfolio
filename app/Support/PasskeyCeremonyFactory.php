<?php

namespace App\Support;

use Spatie\LaravelPasskeys\Actions\ConfigureCeremonyStepManagerFactoryAction;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;

class PasskeyCeremonyFactory extends ConfigureCeremonyStepManagerFactoryAction
{
    public function execute(): CeremonyStepManagerFactory
    {
        $factory = parent::execute();
        $appUrl = rtrim((string) config('app.url'), '/');

        if (parse_url($appUrl, PHP_URL_HOST) === 'localhost') {
            // Local dev: browsers treat http://localhost (any port) as secure; without this, ceremonies fail "HTTPS required".
            $factory->setSecuredRelyingPartyId(['localhost']);
        } else {
            // Only the exact app origin may run ceremonies; subdomains are rejected.
            $factory->setAllowedOrigins([$appUrl]);
        }

        return $factory;
    }
}
