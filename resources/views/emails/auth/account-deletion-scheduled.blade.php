@component('mail::message')
# Your account is scheduled for deletion

Your {{ config('app.name') }} account was deleted and will be removed permanently on **{{ $date }}**.

Changed your mind? Sign in before then and choose **Restore my account**.

@component('mail::button', ['url' => $url])
Sign in to restore
@endcomponent

If you didn’t delete your account, sign in and restore it straight away.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
