<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultation_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->unsignedInteger('price_cents');
            $table->unsignedSmallInteger('duration_minutes');
            $table->json('features');
            $table->boolean('includes_recording')->default(false);
            $table->boolean('includes_followup')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('consultation_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('consultation_availability_windows', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('weekday'); // 0=Sunday … 6=Saturday (Carbon)
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('consultation_coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->unsignedTinyInteger('percent_off');
            $table->json('tier_slugs');
            $table->unsignedInteger('max_redemptions')->nullable();
            $table->unsignedInteger('redeemed_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('consultation_google_credentials', function (Blueprint $table) {
            $table->id();
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->string('email')->nullable();
            $table->string('calendar_id')->default('primary');
            $table->timestamps();
        });

        Schema::create('consultation_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('public_id', 26)->unique();
            $table->foreignId('consultation_tier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consultation_coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->string('client_name');
            $table->string('client_email');
            $table->text('notes')->nullable();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('status', 40);
            $table->unsignedInteger('list_price_cents');
            $table->unsignedTinyInteger('discount_percent')->default(0);
            $table->unsignedInteger('amount_due_cents');
            $table->string('currency', 3)->default('usd');
            $table->string('stripe_checkout_session_id')->nullable()->index();
            $table->string('stripe_payment_intent_id')->nullable();
            $table->string('google_event_id')->nullable();
            $table->string('google_meet_space_name')->nullable();
            $table->string('meet_link')->nullable();
            $table->timestamp('hold_expires_at')->nullable();
            $table->timestamp('payment_due_at')->nullable();
            $table->string('access_token_hash', 64)->unique();
            $table->json('proposed_slots')->nullable();
            $table->string('admin_note')->nullable();
            $table->string('decline_block_title')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'starts_at']);
            $table->index(['starts_at', 'ends_at']);
        });

        Schema::create('consultation_booking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_booking_id')->constrained()->cascadeOnDelete();
            $table->string('event');
            $table->string('actor')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        DB::table('consultation_settings')->insert([
            [
                'key' => 'schedule_timezone',
                'value' => 'UTC',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $now = now();

        DB::table('consultation_tiers')->insert([
            [
                'slug' => 'light',
                'name' => 'Consultation Light',
                'price_cents' => 14900,
                'duration_minutes' => 30,
                'features' => json_encode([
                    ['label' => '30-minute call', 'included' => true],
                    ['label' => 'Two focused guidelines on the call', 'included' => true],
                    ['label' => 'Google Meet', 'included' => true],
                    ['label' => 'Session recording', 'included' => false],
                    ['label' => 'Written follow-up notes', 'included' => false],
                ]),
                'includes_recording' => false,
                'includes_followup' => false,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'pro',
                'name' => 'Consultation Pro',
                'price_cents' => 24900,
                'duration_minutes' => 60,
                'features' => json_encode([
                    ['label' => '60-minute call', 'included' => true],
                    ['label' => 'Infrastructure review for your stack', 'included' => true],
                    ['label' => '5–10 concrete improvement offers', 'included' => true],
                    ['label' => 'Google Meet', 'included' => true],
                    ['label' => 'Session recording', 'included' => false],
                    ['label' => 'Written follow-up notes', 'included' => false],
                ]),
                'includes_recording' => false,
                'includes_followup' => false,
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'max',
                'name' => 'Consultation Max',
                'price_cents' => 34900,
                'duration_minutes' => 60,
                'features' => json_encode([
                    ['label' => '60-minute call', 'included' => true],
                    ['label' => 'Infrastructure review for your stack', 'included' => true],
                    ['label' => '5–10 concrete improvement offers', 'included' => true],
                    ['label' => 'Google Meet', 'included' => true],
                    ['label' => 'Session recording', 'included' => true],
                    ['label' => 'Written follow-up notes', 'included' => true],
                ]),
                'includes_recording' => true,
                'includes_followup' => true,
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_booking_events');
        Schema::dropIfExists('consultation_bookings');
        Schema::dropIfExists('consultation_google_credentials');
        Schema::dropIfExists('consultation_coupons');
        Schema::dropIfExists('consultation_availability_windows');
        Schema::dropIfExists('consultation_settings');
        Schema::dropIfExists('consultation_tiers');
    }
};
