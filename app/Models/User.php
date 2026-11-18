<?php

namespace App\Models;

use App\Support\AnonName;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\LaravelPasskeys\Models\Concerns\HasPasskeys;
use Spatie\LaravelPasskeys\Models\Concerns\InteractsWithPasskeys;

class User extends Authenticatable implements HasPasskeys, MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, InteractsWithPasskeys, Notifiable, Prunable;

    /** Days a deleted account can still be restored by signing in. */
    public const RESTORE_DAYS = 30;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'provider_name',
        'provider_id',
        'avatar_url',
        'role',
        'bio',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'deletion_scheduled_at' => 'datetime',
            'password' => 'hashed',
            'anonymous' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(fn (User $user) => $user->profile_slug ??= self::newProfileSlug());
    }

    public const USERNAME_PATTERN = '/^[a-z][a-z0-9_]{2,29}$/';

    protected $appends = ['profile_handle'];

    public static function newProfileSlug(): string
    {
        do {
            $slug = Str::lower(Str::random(10));
        } while (static::where('username', $slug)->exists());

        return $slug;
    }

    /** What goes after /u/: the chosen username, except while anonymous (it would give them away). */
    public function profileHandle(): string
    {
        return ! $this->anonymous && $this->username ? $this->username : (string) $this->profile_slug;
    }

    protected function getProfileHandleAttribute(): string
    {
        return $this->profileHandle();
    }

    public static function findByProfileHandle(string $handle): ?self
    {
        return static::where('username', $handle)->where('anonymous', false)->first()
            ?? static::where('profile_slug', $handle)->first();
    }

    /** The name everyone else sees: the anonymous name, or the real one (masked when it is just the email's local part). */
    public function publicName(): string
    {
        if ($this->anonymous) {
            return (string) $this->anon_name;
        }

        return strcasecmp((string) $this->name, Str::before((string) $this->email, '@')) === 0 ? mb_substr((string) $this->name, 0, 2).'•••' : (string) $this->name;
    }

    public function publicAvatar(): ?string
    {
        return $this->anonymous ? null : $this->avatar_url;
    }

    /** Switching identity also changes the profile URL, so an old link can't tie the two together. */
    public function setAnonymous(bool $anonymous): void
    {
        if ($anonymous === (bool) $this->anonymous) {
            return;
        }
        $this->forceFill([
            'anonymous' => $anonymous,
            'anon_name' => $this->anon_name ?? AnonName::make(),
            'profile_slug' => self::newProfileSlug(),
        ])->save();
    }

    /** Run daily by `model:prune`: accounts deleted more than RESTORE_DAYS ago are removed for good. */
    public function prunable(): Builder
    {
        return static::where('deletion_scheduled_at', '<=', now()->subDays(self::RESTORE_DAYS));
    }

    public function purgesOn(): ?string
    {
        return $this->deletion_scheduled_at?->addDays(self::RESTORE_DAYS)->toDateString();
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
