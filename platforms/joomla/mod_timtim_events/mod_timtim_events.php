<?php

/**
 * TimTim.Live Events — Joomla site module (Joomla 4 and 5).
 *
 * Renders one <timtim-events> element and loads the hosted TimTim.Live embed,
 * which fetches and draws the events safely. Joomla fetches and stores no
 * event data, and needs no secret: the only key accepted is a website key
 * (tt_pk_live_) or a test key (tt_test_).
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Helper\ModuleHelper;

require_once __DIR__ . '/helper.php';

$attributes = ModTimTimEventsHelper::attributes([
    'location'    => $params->get('location', 'Miami,US'),
    'category'    => $params->get('category', 'music'),
    'limit'       => $params->get('limit', 6),
    'layout'      => $params->get('events_layout', 'grid'),
    'theme'       => $params->get('theme', 'light'),
    'color'       => $params->get('color', '#0e7490'),
    'show_images' => $params->get('show_images', 1),
    'show_price'  => $params->get('show_price', 1),
    'partner_key' => $params->get('partner_key', ''),
]);

Factory::getApplication()->getDocument()->getWebAssetManager()
    ->registerAndUseScript('mod_timtim_events.embed', ModTimTimEventsHelper::EMBED_SRC, [], ['defer' => true]);

require ModuleHelper::getLayoutPath('mod_timtim_events', $params->get('layout', 'default'));
