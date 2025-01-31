@component('mail::message')
# New Contact Form Submission

You have received a new message from your website's contact form.

**Name:** {{ $name }}  
**Email:** {{ $email }}  
**Subject:** {{ $messageSubject }}

**Message:**  
{{ $messageContent }}

@if(count($services) > 0)
**Selected Services:**
@foreach($services as $service)
- {{ $service }}
@endforeach
@endif

**Referrer:** {{ $referrer }}

@component('mail::button', ['url' => config('app.url')])
View Website
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent 