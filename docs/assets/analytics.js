(() => {
  'use strict';
  const config = window.RESUMEIQ_POSTHOG || {};
  const hosts = ['https://us.i.posthog.com', 'https://eu.i.posthog.com'];
  // Stay off until a real public project token and supported host are supplied.
  if (!/^phc_[a-zA-Z0-9]+$/.test(config.token || '') || !hosts.includes(config.host)) return;

  const surface = document.body.dataset.analyticsSurface;
  const actions = new Set(['load_example', 'analyze_resume', 'choose_file', 'see_prototype', 'read_prd', 'read_build_log']);
  const sdk = document.createElement('script');
  sdk.src = config.host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
  sdk.async = true;
  sdk.crossOrigin = 'anonymous';
  sdk.onload = () => {
    try {
      window.posthog.init(config.token, {
        api_host: config.host,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        person_profiles: 'never',
        capture_performance: false,
        capture_exceptions: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        rageclick: false,
        enable_recording_console_log: false,
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: true,
          blockSelector: '#resume, #job, #resume-file, #linkedin-text, #linkedin-file, #linkedin-status, #results, #upload-status, #status, #configuration',
          recordBody: false,
          recordHeaders: false,
          recordCanvas: false,
          maskCapturedNetworkRequestFn: () => null
        },
        loaded: posthog => {
          posthog.register({surface});
          posthog.capture('$pageview');
          document.addEventListener('click', event => {
            const control = event.target.closest('[data-analytics-action]');
            const action = control && control.dataset.analyticsAction;
            if (actions.has(action)) {
              // No input values, filenames, link URLs, result text, or errors.
              try { posthog.capture('ui_clicked', {action}); } catch (_) { /* Keep the app usable. */ }
            }
          });
        }
      });
    } catch (_) {
      // Analytics must never prevent document upload or review.
    }
  };
  document.head.appendChild(sdk);
})();
