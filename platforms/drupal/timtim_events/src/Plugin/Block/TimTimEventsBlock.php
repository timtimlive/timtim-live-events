<?php

declare(strict_types=1);

namespace Drupal\timtim_events\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Shows live events from TimTim.Live.
 *
 * The block renders one <timtim-events> element and attaches the hosted
 * TimTim.Live embed (timtim_events/embed), which fetches and draws the events
 * safely. No event data is fetched or stored by Drupal, and no secret is
 * needed: the only key it accepts is a website key (tt_pk_live_) or a test
 * key (tt_test_), which are made to be seen in pages.
 *
 * @Block(
 *   id = "timtim_events_block",
 *   admin_label = @Translation("TimTim.Live Events"),
 *   category = @Translation("TimTim.Live")
 * )
 */
final class TimTimEventsBlock extends BlockBase {

  /**
   * Layout options the embed understands.
   */
  private const LAYOUTS = ['grid', 'list', 'compact'];

  /**
   * Color themes the embed understands.
   */
  private const THEMES = ['light', 'dark', 'auto'];

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      'location' => 'Miami,US',
      'category' => 'music',
      'limit' => 6,
      'layout' => 'grid',
      'theme' => 'light',
      'color' => '#0e7490',
      'show_images' => TRUE,
      'show_price' => TRUE,
      'partner_key' => '',
    ] + parent::defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state): array {
    $c = $this->getConfiguration();
    $form['location'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Location'),
      '#description' => $this->t('A city, or City,CC — for example Miami,US or Paris,FR.'),
      '#default_value' => $c['location'],
      '#maxlength' => 120,
    ];
    $form['category'] = [
      '#type' => 'select',
      '#title' => $this->t('Event type'),
      '#options' => [
        '' => $this->t('Any'),
        'music' => $this->t('Music'),
        'festival' => $this->t('Festival'),
        'nightlife' => $this->t('Nightlife'),
        'conference' => $this->t('Conference'),
      ],
      '#default_value' => $c['category'],
    ];
    $form['limit'] = [
      '#type' => 'number',
      '#title' => $this->t('How many'),
      '#min' => 1,
      '#max' => 24,
      '#default_value' => $c['limit'],
    ];
    $form['layout'] = [
      '#type' => 'select',
      '#title' => $this->t('Layout'),
      '#options' => ['grid' => $this->t('Cards'), 'list' => $this->t('List'), 'compact' => $this->t('Compact')],
      '#default_value' => $c['layout'],
    ];
    $form['theme'] = [
      '#type' => 'select',
      '#title' => $this->t('Colors'),
      '#options' => ['light' => $this->t('Light'), 'dark' => $this->t('Dark'), 'auto' => $this->t('Match visitor')],
      '#default_value' => $c['theme'],
    ];
    $form['color'] = [
      '#type' => 'color',
      '#title' => $this->t('Button color'),
      '#default_value' => $c['color'],
    ];
    $form['show_images'] = ['#type' => 'checkbox', '#title' => $this->t('Show pictures'), '#default_value' => $c['show_images']];
    $form['show_price'] = ['#type' => 'checkbox', '#title' => $this->t('Show prices'), '#default_value' => $c['show_price']];
    $form['partner_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('TimTim.Live website key'),
      '#description' => $this->t('Optional. Your website key (tt_pk_live_…) shows real events and counts clicks for you. Leave empty for sample events. Never a server key.'),
      '#default_value' => $c['partner_key'],
      '#maxlength' => 160,
    ];
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockValidate($form, FormStateInterface $form_state): void {
    $key = trim((string) $form_state->getValue('partner_key'));
    if ($key !== '' && !self::isPublicKey($key)) {
      $form_state->setErrorByName('partner_key', str_starts_with($key, 'tt_sk_live_')
        ? $this->t('That is a server key. Never put it in a web page — use your website key (tt_pk_live_…).')
        : $this->t('That does not look like a website key (tt_pk_live_…) or a test key (tt_test_…).'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state): void {
    foreach (['location', 'category', 'layout', 'theme', 'color', 'partner_key'] as $name) {
      $this->configuration[$name] = trim((string) $form_state->getValue($name));
    }
    $this->configuration['limit'] = max(1, min(24, (int) $form_state->getValue('limit')));
    $this->configuration['show_images'] = (bool) $form_state->getValue('show_images');
    $this->configuration['show_price'] = (bool) $form_state->getValue('show_price');
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    return [
      '#type' => 'html_tag',
      '#tag' => 'timtim-events',
      '#value' => '',
      '#attributes' => self::embedAttributes($this->getConfiguration()),
      '#attached' => ['library' => ['timtim_events/embed']],
    ];
  }

  /**
   * The <timtim-events> attributes for a configuration: only what is set,
   * only values the embed understands, and never anything but a public key.
   * Drupal escapes every attribute value when it renders the tag.
   */
  public static function embedAttributes(array $c): array {
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
    if (in_array($c['layout'] ?? 'grid', self::LAYOUTS, TRUE) && ($c['layout'] ?? 'grid') !== 'grid') {
      $a['layout'] = $c['layout'];
    }
    if (in_array($c['theme'] ?? 'light', self::THEMES, TRUE) && ($c['theme'] ?? 'light') !== 'light') {
      $a['theme'] = $c['theme'];
    }
    if (preg_match('/^#[0-9a-fA-F]{6}$/', (string) ($c['color'] ?? ''))) {
      $a['color'] = $c['color'];
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

  /**
   * A website key or a test key: the only keys that may appear in a page.
   */
  public static function isPublicKey(string $key): bool {
    return (bool) preg_match('/^(tt_pk_live_|tt_test_)[A-Za-z0-9_-]{8,128}$/', $key);
  }

}
