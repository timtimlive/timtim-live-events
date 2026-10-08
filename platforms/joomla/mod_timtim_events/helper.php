<?php

/**
 * The <timtim-events> attributes and tag for the module's settings.
 *
 * Plain PHP with no Joomla dependency, so platforms/joomla/test/helper_test.php
 * can run it in CI without a Joomla site.
 */

defined('_JEXEC') or die;

final class ModTimTimEventsHelper
{
    /** The hosted TimTim.Live embed — the open-source <timtim-events>. /embed/v1/ only ever grows. */
    public const EMBED_SRC = 'https://timtim.live/embed/v1/timtim-events.js';

    private const LAYOUTS = ['grid', 'list', 'compact'];
    private const THEMES = ['light', 'dark', 'auto'];

    /**
     * Only what is set, only values the embed understands, and never anything but a public key.
     *
     * @param array<string, mixed> $c
     * @return array<string, string>
     */
    public static function attributes(array $c): array
    {
        $a = [];
        $location = trim((string) ($c['location'] ?? ''));
        if ($location !== '') {
            $a['location'] = mb_substr($location, 0, 120);
        }
        $category = strtolower(trim((string) ($c['category'] ?? '')));
        if ($category !== '' && preg_match('/^[a-z0-9_-]{1,40}$/', $category)) {
            $a['category'] = $category;
        }
        $a['limit'] = (string) max(1, min(24, (int) ($c['limit'] ?? 6)));
        $layout = (string) ($c['layout'] ?? 'grid');
        if ($layout !== 'grid' && in_array($layout, self::LAYOUTS, true)) {
            $a['layout'] = $layout;
        }
        $theme = (string) ($c['theme'] ?? 'light');
        if ($theme !== 'light' && in_array($theme, self::THEMES, true)) {
            $a['theme'] = $theme;
        }
        $color = (string) ($c['color'] ?? '');
        if (preg_match('/^#[0-9a-fA-F]{6}$/', $color)) {
            $a['color'] = $color;
        }
        if (empty($c['show_images'])) {
            $a['show-images'] = 'false';
        }
        if (empty($c['show_price'])) {
            $a['show-price'] = 'false';
        }
        $key = trim((string) ($c['partner_key'] ?? ''));
        if ($key !== '' && self::isPublicKey($key)) {
            $a['partner'] = $key;
        }
        return $a;
    }

    /** A website key or a test key: the only keys that may appear in a page. */
    public static function isPublicKey(string $key): bool
    {
        return (bool) preg_match('/^(tt_pk_live_|tt_test_)[A-Za-z0-9_-]{8,128}$/', $key);
    }

    /**
     * The element, with every name and value escaped.
     *
     * @param array<string, string> $attributes
     */
    public static function tag(array $attributes): string
    {
        $html = '<timtim-events';
        foreach ($attributes as $name => $value) {
            $html .= ' ' . htmlspecialchars((string) $name, ENT_QUOTES, 'UTF-8') . '="' . htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8') . '"';
        }
        return $html . '></timtim-events>';
    }
}
