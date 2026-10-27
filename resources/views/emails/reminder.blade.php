<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Client Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 24px; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #12141D; padding: 24px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #F59E0B;">Start4Truckers Reminder</h1>
            <p style="margin: 4px 0 0; font-size: 14px; color: #9CA3AF;">Automated reminder notification</p>
        </div>
        
        <div style="padding: 24px;">
            <p style="font-size: 15px; margin-top: 0;">This is a scheduled reminder for client <strong>{{ $client->display_name }}</strong> ({{ $client->client_number }}).</p>
            
            <div style="background: #FDF8E7; border-left: 4px solid #D97706; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #92400E; letter-spacing: 0.05em;">Reminder Details</p>
                <p style="margin: 0; font-size: 15px; color: #1E293B; font-weight: 500;">{{ $reminder->description }}</p>
                @if($reminder->remind_at)
                    <p style="margin: 8px 0 0; font-size: 13px; color: #78350F;"><strong>Due:</strong> {{ $reminder->remind_at->format('M j, Y g:i A') }}</p>
                @endif
            </div>

            <div style="margin-top: 24px;">
                <a href="{{ $clientUrl }}" style="display: inline-block; background-color: #12141D; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">View Client Profile &rarr;</a>
            </div>
        </div>

        <div style="padding: 16px 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            Start4Truckers CRM Notification System
        </div>
    </div>
</body>
</html>

