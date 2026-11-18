<?php

namespace App\Support;

/** Two-word names like "Quiet Falcon" for people who choose to be anonymous. */
class AnonName
{
    private const ADJECTIVES = ['Quiet', 'Swift', 'Clever', 'Brave', 'Calm', 'Curious', 'Bright', 'Gentle', 'Bold', 'Lucky', 'Silent', 'Steady', 'Witty', 'Nimble', 'Sunny', 'Misty', 'Cosmic', 'Rapid', 'Humble', 'Mellow', 'Keen', 'Lively', 'Patient', 'Daring', 'Hidden', 'Golden', 'Silver', 'Amber', 'Crimson', 'Velvet'];

    private const ANIMALS = ['Falcon', 'Otter', 'Fox', 'Panda', 'Heron', 'Lynx', 'Badger', 'Koala', 'Raven', 'Tiger', 'Dolphin', 'Owl', 'Wolf', 'Gecko', 'Bison', 'Crane', 'Hedgehog', 'Lemur', 'Puffin', 'Marten', 'Sparrow', 'Yak', 'Beaver', 'Ibis', 'Jaguar', 'Moose', 'Narwhal', 'Pelican', 'Quokka', 'Walrus'];

    public static function make(): string
    {
        return self::ADJECTIVES[random_int(0, count(self::ADJECTIVES) - 1)].' '.self::ANIMALS[random_int(0, count(self::ANIMALS) - 1)];
    }
}
