<?php

namespace Tests\Unit;

use App\Mail\ContactFormMail;
use Tests\TestCase;
use Illuminate\Support\Facades\Config;
use PHPUnit\Framework\Attributes\Test;

class ContactFormMailTest extends TestCase
{
    #[Test]
    public function it_contains_correct_data_in_email()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message',
            'services' => ['Cloud Architecture', 'DevOps'],
            'referrer' => 'direct'
        ];

        $mailable = new ContactFormMail($data);
        
        $mailable->assertSeeInHtml('John Doe');
        $mailable->assertSeeInHtml('john@example.com');
        $mailable->assertSeeInHtml('Test Subject');
        $mailable->assertSeeInHtml('Test Message');
        $mailable->assertSeeInHtml('Cloud Architecture');
        $mailable->assertSeeInHtml('DevOps');
        $mailable->assertSeeInHtml('direct');
    }

    #[Test]
    public function it_has_correct_subject()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message'
        ];

        $mailable = new ContactFormMail($data);
        $this->assertEquals('New Contact Form Submission', $mailable->build()->subject);
    }

    #[Test]
    public function it_handles_missing_optional_data()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message'
        ];

        $mailable = new ContactFormMail($data);
        $builtMailable = $mailable->build();
        
        $viewData = $builtMailable->buildViewData();
        $this->assertEquals([], $viewData['services'] ?? []);
        $this->assertEquals('direct', $viewData['referrer'] ?? 'direct');
    }

    #[Test]
    public function it_handles_html_in_message()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => '<p>Test Message</p><script>alert("xss")</script>',
            'services' => ['Service 1'],
            'referrer' => 'direct'
        ];

        $mailable = new ContactFormMail($data);
        $html = $mailable->render();
        
        $this->assertStringContainsString('&lt;script&gt;', $html);
        $this->assertStringNotContainsString('<script>', $html);
    }

    #[Test]
    public function it_handles_long_content()
    {
        $longMessage = str_repeat('a', 10000);
        $data = [
            'name' => str_repeat('n', 255),
            'email' => str_repeat('e', 245) . '@test.com',
            'subject' => str_repeat('s', 255),
            'message' => $longMessage,
            'services' => array_fill(0, 50, 'Service'),
            'referrer' => str_repeat('r', 255)
        ];

        $mailable = new ContactFormMail($data);
        $mailable->assertSeeInHtml($longMessage);
        $mailable->assertSeeInHtml('Service');
    }

    #[Test]
    public function it_handles_special_characters()
    {
        $data = [
            'name' => 'John & Doe',
            'email' => 'john+doe@example.com',
            'subject' => 'Test & Subject',
            'message' => 'Test Message with émojis 🚀',
            'services' => ['Service & Co.', 'Test & More'],
            'referrer' => 'google & bing'
        ];

        $mailable = new ContactFormMail($data);
        $html = $mailable->render();
        
        $this->assertStringContainsString('John &amp; Doe', $html);
        $this->assertStringContainsString('john+doe@example.com', $html);
        $this->assertStringContainsString('Test &amp; Subject', $html);
        $this->assertStringContainsString('Test Message with émojis 🚀', $html);
        $this->assertStringContainsString('Service &amp; Co.', $html);
    }

    #[Test]
    public function it_can_be_sent_to_configured_recipient()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message'
        ];

        $mailable = new ContactFormMail($data);
        $mailable->to('admin@example.com');
        
        $this->assertEquals('admin@example.com', $mailable->to[0]['address']);
    }

    #[Test]
    public function it_can_set_reply_to_as_sender()
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'Test Subject',
            'message' => 'Test Message'
        ];

        $mailable = new ContactFormMail($data);
        $mailable->replyTo($data['email'], $data['name']);
        
        $this->assertEquals('john@example.com', $mailable->replyTo[0]['address']);
        $this->assertEquals('John Doe', $mailable->replyTo[0]['name']);
    }
} 