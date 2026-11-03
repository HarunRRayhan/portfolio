@component('mail::message')
# Confirm your subscription

Someone, hopefully you, asked to get new posts and tools from {{ config('app.name') }} by email. Use the button below to confirm.

@component('mail::button', ['url' => $url])
Confirm subscription
@endcomponent

If you didn’t ask for this, you can ignore this email. You won’t be added.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
