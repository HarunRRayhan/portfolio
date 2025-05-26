<?php

namespace App\Console\Commands;

use App\Mail\ContactFormMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Resend\Laravel\Facades\Resend;

class TestResendEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'resend:test {email} {--method=mail : Method to use (mail or resend)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Resend email integration by sending a test email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $method = $this->option('method');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Please provide a valid email address.');
            return 1;
        }

        $this->info("Testing Resend integration...");
        $this->info("Sending to: {$email}");
        $this->info("Method: {$method}");

        try {
            if ($method === 'resend') {
                $this->sendWithResendFacade($email);
            } else {
                $this->sendWithMailFacade($email);
            }

            $this->info('✅ Email sent successfully!');
            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Failed to send email: ' . $e->getMessage());
            return 1;
        }
    }

    private function sendWithMailFacade($email)
    {
        $data = [
            'name' => 'Test User',
            'email' => $email,
            'subject' => 'Test Email via Mail Facade',
            'message' => 'This is a test email sent via Laravel Mail facade using Resend.',
            'services' => ['Testing'],
            'referrer' => 'artisan-command'
        ];

        Mail::to($email)->send(new ContactFormMail($data));
        $this->line('Sent using Laravel Mail facade');
    }

    private function sendWithResendFacade($email)
    {
        $result = Resend::emails()->send([
            'from' => config('mail.from.address'),
            'to' => [$email],
            'subject' => 'Test Email via Resend Facade',
            'html' => '
                <h1>🚀 Resend Test Email</h1>
                <p>This is a test email sent directly via the Resend facade.</p>
                <p><strong>Sent from:</strong> ' . config('app.name') . '</p>
                <p><strong>Timestamp:</strong> ' . now()->toDateTimeString() . '</p>
                <hr>
                <p><em>This email was sent using the Resend Laravel package.</em></p>
            ',
        ]);

        $this->line('Sent using Resend facade');
        $this->line('Resend Email ID: ' . ($result['id'] ?? 'N/A'));
    }
}
