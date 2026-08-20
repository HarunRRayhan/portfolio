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
    public function it_masks_a_two_character_local_part_fully_after_the_visible_prefix()
    {
        $subscriber = new Subscriber(['email' => 'jo@example.com']);

        $this->assertSame('jo***@example.com', $subscriber->maskedEmail());
    }

    #[Test]
    public function it_fully_masks_a_malformed_email_with_no_at_sign_instead_of_erroring()
    {
        $subscriber = new Subscriber(['email' => 'not-an-email']);

        $this->assertSame('************', $subscriber->maskedEmail());
    }
}
