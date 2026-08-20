<?php

namespace Tests\Unit;

use App\Services\CountryResolver;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;

class CountryResolverTest extends TestCase
{
    private function requestWithHeader(?string $value): Request
    {
        $request = Request::create('/bio');

        if ($value !== null) {
            $request->headers->set('Cf-Ipcountry', $value);
        }

        return $request;
    }

    public function test_resolves_a_valid_country_code(): void
    {
        $this->assertSame('BD', (new CountryResolver)->resolve($this->requestWithHeader('BD')));
    }

    public function test_uppercases_the_header_value(): void
    {
        $this->assertSame('US', (new CountryResolver)->resolve($this->requestWithHeader('us')));
    }

    public function test_returns_null_when_header_is_missing(): void
    {
        $this->assertNull((new CountryResolver)->resolve($this->requestWithHeader(null)));
    }

    public function test_returns_null_for_cloudflares_unknown_sentinel(): void
    {
        $this->assertNull((new CountryResolver)->resolve($this->requestWithHeader('XX')));
    }

    public function test_returns_null_for_a_malformed_value(): void
    {
        $this->assertNull((new CountryResolver)->resolve($this->requestWithHeader('T1')));
        $this->assertNull((new CountryResolver)->resolve($this->requestWithHeader('USA')));
        $this->assertNull((new CountryResolver)->resolve($this->requestWithHeader('')));
    }
}
