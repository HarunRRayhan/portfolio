@component('mail::message')
# GitHub Sponsors webhook failed

**Delivery:** {{ $deliveryId }}
**Error:** {{ $error }}

GitHub can redeliver it from the webhook settings page.

{{ config('app.name') }}
@endcomponent
