alter table public.product_events
  drop constraint if exists product_events_event_name_check;

alter table public.product_events
  add constraint product_events_event_name_check
  check (
    event_name in (
      'landing_view',
      'quick_started',
      'quick_completed',
      'detailed_opened',
      'detailed_completed',
      'save_clicked',
      'result_saved',
      'ask_prism_used',
      'share_card_created',
      'upgrade_detailed',
      'feedback_submitted',
      'destiny_timeline_opened',
      'destiny_date_inspected'
    )
  );
