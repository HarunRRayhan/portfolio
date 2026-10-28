<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactFormMail extends Mailable
{
    use SerializesModels;

    public array $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function build()
    {
        // Reply-To is the visitor, so hitting Reply goes straight to them.
        return $this->subject('Contact: '.$this->data['subject'])
                    ->replyTo($this->data['email'], $this->data['name'])
                    ->markdown('emails.contact-form')
                    ->with([
                        'name' => $this->data['name'],
                        'email' => $this->data['email'],
                        'messageSubject' => $this->data['subject'],
                        'messageContent' => $this->data['message'],
                        'services' => $this->data['services'] ?? [],
                        'referrer' => $this->data['referrer'] ?? 'direct'
                    ]);
    }
}
