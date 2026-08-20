<?php

namespace Tests\Unit;

use App\Models\Subscriber;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SubscriberMaskedEmailTest extends TestCase
{
    #[Test]
    public function it_masks_the_local_part_after_the_first_two_characters()
    {
        $subscriber = new Subscriber(['email' => 'harun@gmail.com']);

        $this->assertSame('ha***@gmail.com', $subscriber->maskedEmail());
    }

    #[Test]
    public function it_keeps_a_single_character_local_part_visible_before_masking()
    {
        $subscriber = new Subscriber(['email' => 'a@x.com']);

        $this->assertSame('a***@x.com', $subscriber->maskedEmail());
    }

    #[Test]
    public function it_hides_at_least_one_character_of_a_two_character_local_part()
    {
        $subscriber = new Subscriber(['email' => 'jo@example.com']);

        $this->assertSame('j***@example.com', $subscriber->maskedEmail());
    }

    #[Test]
    public function it_fully_masks_a_malformed_email_with_no_at_sign_instead_of_erroring()
    {
        $subscriber = new Subscriber(['email' => 'not-an-email']);

        $this->assertSame('************', $subscriber->maskedEmail());
    }

    #[Test]
    public function it_fully_masks_a_malformed_email_with_more_than_one_at_sign()
    {
        $subscriber = new Subscriber(['email' => 'a@b@evil.com']);

        $this->assertSame(str_repeat('*', 12), $subscriber->maskedEmail());
    }

    #[Test]
    public function it_masks_a_null_or_empty_email_as_a_visible_placeholder_not_a_blank_string()
    {
        $subscriber = new Subscriber(['email' => null]);

        $this->assertSame('***', $subscriber->maskedEmail());
    }

    #[Test]
    public function it_never_exposes_the_real_email_via_array_or_json_serialization()
    {
        $subscriber = new Subscriber(['email' => 'harun@gmail.com']);

        $this->assertArrayNotHasKey('email', $subscriber->toArray());
        $this->assertStringNotContainsString('harun@gmail.com', $subscriber->toJson());
    }
}
