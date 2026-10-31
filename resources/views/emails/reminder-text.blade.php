Start4Truckers Reminder

Client: {{ $client->display_name }} ({{ $client->client_number }})
Description: {{ $reminder->description }}
@if($reminder->remind_at)
Due: {{ $reminder->dueLabel() }} ({{ $reminder->displayTimezone() }})
@endif

Open Client Profile: {{ $clientUrl }}

