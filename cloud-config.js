'use strict';
// Public browser configuration only. Never put a secret/service-role key here.
// Enable only this project's approved production path and local development origin.
globalThis.PythonCloudConfig = Object.freeze({
 enabled: globalThis.location?.origin === 'http://127.0.0.1:8000' ||
  (globalThis.location?.origin === 'https://steveniotech.github.io' &&
   /^\/python-steps-lab(?:\/|$)/.test(globalThis.location?.pathname || '')),
 url: 'https://omqknvspgjbfgjfefpqe.supabase.co',
 publishableKey: 'sb_publishable_zEo8ZDKVPM4f0xq1I2zqdw_ZMA1T1W-',
 accountDomain: 'students.pythonsteps.example'
});
