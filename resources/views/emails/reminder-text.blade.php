Start4Truckers Reminder

Client: {{ $client->display_name }} ({{ $client->client_number }})
Description: {{ $reminder->description }}
@if($reminder->remind_at)
Due: {{ $reminder->remind_at->format('M j, Y g:i A') }}
@endif

Open Client Profile: {{ $clientUrl }}
