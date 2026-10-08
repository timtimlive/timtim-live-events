<?php

/**
 * Runs the Joomla module's attribute rules without Joomla:  php platforms/joomla/test/helper_test.php
 * Exits 1 on the first failure.
 */

declare(strict_types=1);

define('_JEXEC', 1);
require __DIR__ . '/../mod_timtim_events/helper.php';

$failures = 0;
function check(bool $ok, string $what): void
{
    global $failures;
    echo ($ok ? 'ok   ' : 'FAIL ') . $what . PHP_EOL;
    if (!$ok) {
        $failures++;
    }
}

$defaults = ModTimTimEventsHelper::attributes(['location' => 'Miami,US', 'category' => 'Music', 'limit' => 6, 'layout' => 'grid', 'theme' => 'light', 'color' => '#0e7490', 'show_images' => 1, 'show_price' => 1, 'partner_key' => '']);
check($defaults === ['location' => 'Miami,US', 'category' => 'music', 'limit' => '6', 'color' => '#0e7490'], 'defaults are left out, category lower-cased');

$all = ModTimTimEventsHelper::attributes(['location' => 'Paris,FR', 'category' => 'festival', 'limit' => 99, 'layout' => 'compact', 'theme' => 'dark', 'color' => 'red', 'show_images' => 0, 'show_price' => 0, 'partner_key' => 'tt_pk_live_abcdefgh12']);
check($all['limit'] === '24', 'limit is capped at 24');
check(($all['layout'] ?? '') === 'compact' && ($all['theme'] ?? '') === 'dark', 'layout and theme pass through');
check(!isset($all['color']), 'a non-hex color is dropped');
check(($all['show-images'] ?? '') === 'false' && ($all['show-price'] ?? '') === 'false', 'pictures and prices can be hidden');
check(($all['partner'] ?? '') === 'tt_pk_live_abcdefgh12', 'a website key is written');

$server = ModTimTimEventsHelper::attributes(['partner_key' => 'tt_sk_live_abcdefgh12']);
check(!isset($server['partner']), 'a server key is NEVER written');
$odd = ModTimTimEventsHelper::attributes(['layout' => 'carousel', 'theme' => 'neon', 'category' => 'a b<c>']);
check(!isset($odd['layout']) && !isset($odd['theme']) && !isset($odd['category']), 'unknown layout, theme and category are dropped');

$tag = ModTimTimEventsHelper::tag(['location' => '"><script>alert(1)</script>']);
check(strpos($tag, '<script>') === false && strpos($tag, '&quot;&gt;&lt;script&gt;') !== false, 'values are escaped');
check(ModTimTimEventsHelper::EMBED_SRC === 'https://timtim.live/embed/v1/timtim-events.js', 'loads the hosted embed');

exit($failures === 0 ? 0 : 1);
