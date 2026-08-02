/**
 * contact.js — page logic for contact.html: company chrome + SEO + the
 * Web3Forms-powered contact form (free, no backend, client-side POST).
 *
 * EMAIL AUTOMATION (Web3Forms) SETUP (one time):
 *   1. Go to https://web3forms.com → enter YOUR email → copy the "Access Key"
 *      it shows you (no signup/password needed).
 *   2. Paste it below in place of YOUR-ACCESS-KEY-HERE.
 * After that, every message sent from this form lands in that inbox, with the
 * visitor's address as the reply-to (just hit Reply).
 * Free tier: 250 submissions/month. The honeypot field in the form blocks bots.
 * Real delivery needs a browser over http(s) — not file:// and not server-side.
 */
import { initLayout } from '../components/layout.js';
import { applySEO, injectJsonLd, breadcrumbJsonLd } from '../components/seo.js';

const WEB3FORMS_ACCESS_KEY = 'f5711d49-3704-4174-a94b-480dc0cfc42c';

initLayout({ variant: 'company', active: 'contact' });

applySEO({
  title: 'Contact Us — IndiaExplore',
  description: 'Get in touch with the IndiaExplore team — questions, feedback, partnership enquiries or destination suggestions.',
  canonicalPath: 'contact.html',
  keywords: ['contact indiaexplore', 'indiaexplore support'],
});
injectJsonLd(breadcrumbJsonLd([
  { name: 'Home', path: 'index.html' },
  { name: 'Contact', path: 'contact.html' },
]));

// ─── Contact form ───────────────────────────────────────
const form = document.getElementById('contactForm');
const err = document.getElementById('cf-error');
const success = document.getElementById('cf-success');
const submitBtn = form.querySelector('button[type="submit"]');
const btnLabel = submitBtn.textContent;
function showErr(msg, focusEl) { err.textContent = msg; err.style.display = 'block'; if (focusEl) focusEl.focus(); }
function busy(on) {
  submitBtn.disabled = on;
  submitBtn.textContent = on ? 'Sending…' : btnLabel;
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  err.style.display = 'none';
  const name = document.getElementById('cf-name').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const subject = document.getElementById('cf-subject').value.trim();
  const message = document.getElementById('cf-message').value.trim();
  if (!name) { showErr('Please enter your name.', document.getElementById('cf-name')); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErr('Please enter a valid email address.', document.getElementById('cf-email')); return; }
  if (!message) { showErr('Please enter a message.', document.getElementById('cf-message')); return; }

  // If the key hasn't been configured yet, acknowledge locally so the
  // form still demos, but warn the developer in the console.
  if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR-ACCESS-KEY-HERE') {
    console.warn('[contact] Web3Forms access key not set — message not actually sent. ' +
                 'Get a free key at https://web3forms.com and set WEB3FORMS_ACCESS_KEY in js/pages/contact.js.');
    form.style.display = 'none';
    success.style.display = 'block';
    return;
  }

  busy(true);
  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: subject || ('New message from ' + name + ' — IndiaExplore'),
      from_name: 'IndiaExplore Contact Form',
      name: name,
      email: email,         // shown in the email; used as reply-to below
      replyto: email,
      message: message,
      botcheck: form.botcheck && form.botcheck.checked,
    }),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      busy(false);
      if (data && data.success) {
        form.style.display = 'none';
        success.style.display = 'block';
      } else {
        showErr((data && data.message ? data.message : 'Something went wrong') +
                '. You can also email us directly at naturethunder8@gmail.com.');
      }
    })
    .catch(function () {
      busy(false);
      showErr('Could not send right now — please check your connection, ' +
              'or email us directly at naturethunder8@gmail.com.');
    });
});

document.getElementById('cf-again').addEventListener('click', function () {
  form.reset();
  success.style.display = 'none';
  form.style.display = 'block';
});
