<?php

namespace Tests\Feature;

use App\Models\ContactSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;
use App\Mail\ContactFormMail;
use PHPUnit\Framework\Attributes\Test;

class ContactSubmissionTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    #[Test]
    public function it_can_submit_contact_form_with_valid_data()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message',
            'services' => ['Cloud Architecture', 'DevOps'],
            'referrer' => 'direct'
        ];

        $response = $this->post('/contact', $data);

        $response->assertRedirect();
        $response->assertSessionHas('flash.type', 'success');
        
        $this->assertDatabaseHas('contact_submissions', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message',
        ]);

        $submission = ContactSubmission::first();
        $this->assertEquals(['Cloud Architecture', 'DevOps'], $submission->services);
        $this->assertEquals('sent', $submission->status);

        Mail::assertQueued(ContactFormMail::class);
    }

    #[Test]
    public function it_validates_required_fields()
    {
        $response = $this->post('/contact', []);

        $response->assertSessionHasErrors(['name', 'email', 'subject', 'message']);
        $this->assertDatabaseCount('contact_submissions', 0);
        Mail::assertNothingQueued();
    }

    #[Test]
    public function it_validates_email_format()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'subject' => 'Test Subject',
            'message' => 'Test Message'
        ];

        $response = $this->post('/contact', $data);

        $response->assertSessionHasErrors(['email']);
        $this->assertDatabaseCount('contact_submissions', 0);
        Mail::assertNothingQueued();
    }

    #[Test]
    public function it_handles_submission_with_no_services()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message',
            'services' => [],
            'referrer' => 'direct'
        ];

        $response = $this->post('/contact', $data);

        $response->assertRedirect();
        $response->assertSessionHas('flash.type', 'success');
        
        $submission = ContactSubmission::first();
        $this->assertEquals('John Doe', $submission->name);
        $this->assertEquals('john@example.com', $submission->email);
        $this->assertEquals([], $submission->services);
    }

    #[Test]
    public function it_handles_submission_with_custom_services()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message',
            'services' => ['Custom Service 1', 'Custom Service 2'],
            'referrer' => 'direct'
        ];

        $response = $this->post('/contact', $data);

        $response->assertRedirect();
        $submission = ContactSubmission::first();
        $this->assertEquals(['Custom Service 1', 'Custom Service 2'], $submission->services);
    }

    #[Test]
    public function it_handles_long_messages()
    {
        $longMessage = str_repeat('a', 10000);
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => $longMessage,
            'services' => ['Cloud Architecture'],
            'referrer' => 'direct'
        ];

        $response = $this->post('/contact', $data);

        $response->assertRedirect();
        $submission = ContactSubmission::first();
        $this->assertEquals($longMessage, $submission->message);
    }

    #[Test]
    public function it_handles_special_characters_in_input()
    {
        $data = [
            'name' => 'John <script>alert("xss")</script> Doe',
            'email' => 'john@example.com',
            'subject' => 'Test & Subject < > " \'',
            'message' => 'Test Message with émojis 🚀 and symbols &<>"\'"',
            'services' => ['Cloud & Architecture'],
            'referrer' => 'direct'
        ];

        $response = $this->post('/contact', $data);

        $response->assertRedirect();
        $submission = ContactSubmission::first();
        $this->assertEquals('John <script>alert("xss")</script> Doe', $submission->name);
        $this->assertEquals('Test & Subject < > " \'', $submission->subject);
    }

    #[Test]
    public function it_handles_concurrent_submissions()
    {
        $data1 = [
            'name' => 'User 1',
            'email' => 'user1@example.com',
            'subject' => 'Subject 1',
            'message' => 'Message 1',
            'services' => ['Service 1'],
            'referrer' => 'direct'
        ];

        $data2 = [
            'name' => 'User 2',
            'email' => 'user2@example.com',
            'subject' => 'Subject 2',
            'message' => 'Message 2',
            'services' => ['Service 2'],
            'referrer' => 'direct'
        ];

        $response1 = $this->post('/contact', $data1);
        $response2 = $this->post('/contact', $data2);

        $response1->assertRedirect();
        $response2->assertRedirect();

        $this->assertDatabaseCount('contact_submissions', 2);
        Mail::assertQueued(ContactFormMail::class, 2);
    }

    #[Test]
    public function it_handles_empty_referrer()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message',
            'services' => ['Service 1']
            // referrer is intentionally omitted
        ];

        $response = $this->post('/contact', $data);

        $response->assertRedirect();
        $submission = ContactSubmission::first();
        $this->assertNull($submission->referrer); // Changed to expect null for missing referrer
    }

    #[Test]
    public function it_handles_maximum_length_inputs()
    {
        $maxLengthString = str_repeat('a', 255);
        $data = [
            'name' => $maxLengthString,
            'email' => str_repeat('a', 245) . '@test.com', // 255 chars total
            'subject' => $maxLengthString,
            'message' => str_repeat('a', 65535), // Text column max
            'services' => ['Service 1'],
            'referrer' => $maxLengthString
        ];

        $response = $this->post('/contact', $data);

        $response->assertRedirect();
        $this->assertDatabaseHas('contact_submissions', [
            'name' => $maxLengthString,
            'subject' => $maxLengthString,
        ]);
    }

    #[Test]
    public function it_validates_maximum_length_exceeded()
    {
        $tooLongString = str_repeat('a', 256);
        $data = [
            'name' => $tooLongString,
            'email' => 'test@example.com',
            'subject' => $tooLongString,
            'message' => 'Test message',
        ];

        $response = $this->post('/contact', $data);

        $response->assertSessionHasErrors(['name', 'subject']);
        $this->assertDatabaseCount('contact_submissions', 0);
    }

    #[Test]
    public function it_handles_html_injection_in_services()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message',
            'services' => ['<script>alert("xss")</script>', '<img src="x" onerror="alert(1)">'],
            'referrer' => 'direct'
        ];

        $response = $this->post('/contact', $data);

        $response->assertRedirect();
        $submission = ContactSubmission::first();
        $this->assertEquals(
            ['<script>alert("xss")</script>', '<img src="x" onerror="alert(1)">'],
            $submission->services
        );
    }
} 