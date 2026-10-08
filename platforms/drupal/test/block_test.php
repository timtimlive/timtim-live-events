<?php

/**
 * Runs the Drupal block's attribute rules without Drupal:  php platforms/drupal/test/block_test.php
 * The two Drupal classes the block extends are replaced by minimal stand-ins below.
 * Exits 1 on the first failure.
 */

declare(strict_types=1);

namespace Drupal\Core\Form {
    interface FormStateInterface {}
}

namespace Drupal\Core\Block {
    abstract class BlockBase
    {
        protected array $configuration = [];
        public function defaultConfiguration() { return []; }
        public function getConfiguration() { return $this->configuration + $this->defaultConfiguration(); }
        protected function t(string $s) { return $s; }
    }
}

namespace {
    require __DIR__ . '/../timtim_events/src/Plugin/Block/TimTimEventsBlock.php';

    use Drupal\timtim_events\Plugin\Block\TimTimEventsBlock as B;

    $failures = 0;
    function check(bool $ok, string $what): void
    {
        global $failures;
        echo ($ok ? 'ok   ' : 'FAIL ') . $what . PHP_EOL;
        if (!$ok) {
            $failures++;
        }
    }

    $block = new B();
    $defaults = B::embedAttributes($block->getConfiguration());
    check($defaults === ['location' => 'Miami,US', 'category' => 'music', 'limit' => '6', 'color' => '#0e7490'], 'defaults render only what is needed');

    $all = B::embedAttributes(['location' => 'Paris,FR', 'category' => 'Festival', 'limit' => 500, 'layout' => 'list', 'theme' => 'auto', 'color' => '#FF0066', 'show_images' => false, 'show_price' => false, 'partner_key' => 'tt_test_abcdefgh12']);
    check($all['limit'] === '24' && $all['category'] === 'festival', 'limit capped, category lower-cased');
    check(($all['layout'] ?? '') === 'list' && ($all['theme'] ?? '') === 'auto', 'layout and theme pass through');
    check(($all['show-images'] ?? '') === 'false' && ($all['show-price'] ?? '') === 'false', 'pictures and prices can be hidden');
    check(($all['partner'] ?? '') === 'tt_test_abcdefgh12', 'a test key is written');

    check(!isset(B::embedAttributes(['partner_key' => 'tt_sk_live_abcdefgh12'])['partner']), 'a server key is NEVER written');
    check(B::isPublicKey('tt_pk_live_abcdefgh12') && !B::isPublicKey('tt_sk_live_abcdefgh12') && !B::isPublicKey('hello'), 'only public keys are public');
    $odd = B::embedAttributes(['layout' => 'carousel', 'theme' => 'neon', 'category' => '<b>', 'color' => 'javascript:alert(1)']);
    check(!isset($odd['layout']) && !isset($odd['theme']) && !isset($odd['category']) && !isset($odd['color']), 'unknown values are dropped');

    $libraries = file_get_contents(__DIR__ . '/../timtim_events/timtim_events.libraries.yml');
    check(strpos($libraries, 'https://timtim.live/embed/v1/timtim-events.js') !== false, 'the library loads the hosted embed');

    exit($failures === 0 ? 0 : 1);
}
