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
        $this->assertNull($submission->referrer);
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

    #[Test]
    public function it_validates_email_with_various_formats()
    {
        $validEmails = [
            'test@example.com',
            'test+label@example.com',
            'test.name@example.co.uk',
            'test.name-with-dash@example.com',
            '123@example.com'
        ];

        $invalidEmails = [
            'invalid-email',
            'test@',
            '@example.com',
            'test@.com',
            'test@example.',
            'test@exam ple.com',
            'test@example..com',
        ];

        foreach ($validEmails as $email) {
            $data = [
                'name' => 'John Doe',
                'email' => $email,
                'subject' => 'Test Subject',
                'message' => 'Test Message'
            ];

            $response = $this->post('/contact', $data);
            $response->assertSessionDoesntHaveErrors('email');
        }

        foreach ($invalidEmails as $email) {
            $data = [
                'name' => 'John Doe',
                'email' => $email,
                'subject' => 'Test Subject',
                'message' => 'Test Message'
            ];

            $response = $this->post('/contact', $data);
            $response->assertSessionHasErrors('email');
        }
    }

    #[Test]
    public function it_validates_services_array()
    {
        // Test invalid service format (not an array)
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message',
            'services' => 'Not an array'
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionHasErrors('services');

        // Test invalid service items (non-string values)
        $data['services'] = [123, true, ['nested']];
        $response = $this->post('/contact', $data);
        $response->assertSessionHasErrors('services.*');

        // Test empty array (should be valid as it's nullable)
        $data['services'] = [];
        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors('services');

        // Test array with valid strings
        $data['services'] = ['Service 1', 'Service 2'];
        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors('services');
    }

    #[Test]
    public function it_validates_string_fields()
    {
        // Test non-string values
        $data = [
            'name' => ['array instead of string'],
            'email' => 'john@example.com',
            'subject' => 123,
            'message' => true
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionHasErrors(['name', 'subject', 'message']);

        // Test with valid UTF-8 characters
        $data = [
            'name' => 'John Doe 高橋',
            'email' => 'john@example.com',
            'subject' => 'Test Subject ✨',
            'message' => 'Hello こんにちは 👋',
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors(['name', 'subject', 'message']);
    }

    #[Test]
    public function it_validates_required_fields_are_not_empty()
    {
        $data = [
            'name' => '',
            'email' => '',
            'subject' => '',
            'message' => ''
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionHasErrors(['name', 'email', 'subject', 'message']);
    }

    #[Test]
    public function it_validates_name_length()
    {
        $data = [
            'name' => str_repeat('a', 256),
            'email' => 'test@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message'
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionHasErrors('name');

        $data['name'] = str_repeat('a', 255);
        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors('name');
    }

    #[Test]
    public function it_validates_email_length()
    {
        $data = [
            'name' => 'John Doe',
            'email' => str_repeat('a', 247) . '@test.com', // 256 chars
            'subject' => 'Test Subject',
            'message' => 'Test Message'
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionHasErrors('email');

        $data['email'] = str_repeat('a', 246) . '@test.com'; // 255 chars
        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors('email');
    }

    #[Test]
    public function it_validates_subject_length()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'test@example.com',
            'subject' => str_repeat('a', 256),
            'message' => 'Test Message'
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionHasErrors('subject');

        $data['subject'] = str_repeat('a', 255);
        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors('subject');
    }

    #[Test]
    public function it_allows_long_messages()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'test@example.com',
            'subject' => 'Test Subject',
            'message' => str_repeat('a', 65535)
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors('message');
    }

    #[Test]
    public function it_validates_referrer_field()
    {
        // Test with valid referrer
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message',
            'referrer' => 'https://example.com'
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors('referrer');

        // Test with too long referrer
        $data['referrer'] = str_repeat('a', 256);
        $response = $this->post('/contact', $data);
        $response->assertSessionHasErrors('referrer');

        // Test with null referrer (should be valid as it's nullable)
        $data['referrer'] = null;
        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors('referrer');

        // Test with empty string referrer (should be valid as it's nullable)
        $data['referrer'] = '';
        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors('referrer');
    }

    #[Test]
    public function it_preserves_whitespace_in_message()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => "First line\nSecond line\n\nThird line with    spaces",
            'services' => ['Service 1', 'Service 2'],
            'referrer' => 'direct'
        ];

        $response = $this->post('/contact', $data);
        $response->assertSessionDoesntHaveErrors();
        
        $submission = ContactSubmission::first();
        $this->assertEquals("First line\nSecond line\n\nThird line with    spaces", $submission->message);
    }
} 