@if(filled($booking->client_message))
@foreach(preg_split("/\r\n|\n|\r/", $booking->client_message) as $line)
{{ $line }}

@endforeach
@endif
