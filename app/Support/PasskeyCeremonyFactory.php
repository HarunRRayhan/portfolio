<?php

namespace App\Support;

use Spatie\LaravelPasskeys\Actions\ConfigureCeremonyStepManagerFactoryAction;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;

class PasskeyCeremonyFactory extends ConfigureCeremonyStepManagerFactoryAction
{
    public function execute(): CeremonyStepManagerFactory
    {
        $factory = parent::execute();

        // Browsers treat http://localhost as a secure context; without this, local dev passkeys fail "HTTPS required".
        $factory->setSecuredRelyingPartyId(['localhost']);

        return $factory;
    }
}
