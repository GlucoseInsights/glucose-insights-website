/**
 * Mailchimp Subscribe Handler for GlucoseInsights Website
 *
 * Handles subscribe forms (.subscribe-form, .newsletter-form)
 * and submits to Mailchimp via JSONP.
 */
(function () {
  'use strict';

  var MAILCHIMP_URL = 'https://glucoseinsights.us22.list-manage.com/subscribe/post-json?u=b09e085a8d2f566b9138d4dc8&id=d4c6ab5867&f_id=0068e2e1f0';

  function submitToMailchimp(email) {
    var url = MAILCHIMP_URL + '&EMAIL=' + encodeURIComponent(email) + '&tags=website_subscriber';

    return new Promise(function (resolve, reject) {
      var callbackName = 'mc_callback_' + Date.now();
      var script = document.createElement('script');

      window[callbackName] = function (response) {
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
        if (response.result === 'success') {
          resolve(response);
        } else {
          reject(new Error(response.msg || 'Subscription failed'));
        }
      };

      script.src = url + '&c=' + callbackName;
      script.onerror = function () {
        delete window[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
        reject(new Error('Network error'));
      };

      document.head.appendChild(script);
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var emailInput = form.querySelector('input[type="email"]');
    var submitBtn = form.querySelector('button[type="submit"]');
    if (!emailInput || !emailInput.value) return;

    var originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    submitToMailchimp(emailInput.value)
      .then(function () {
        emailInput.value = '';
        submitBtn.textContent = 'Subscribed!';
        submitBtn.style.background = 'var(--accent-dim, #2ab86b)';
        setTimeout(function () {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      })
      .catch(function (err) {
        var msg = err.message || 'Something went wrong';
        if (msg.indexOf('already subscribed') > -1) {
          submitBtn.textContent = 'Already subscribed';
        } else {
          submitBtn.textContent = 'Try again';
        }
        setTimeout(function () {
          submitBtn.textContent = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var forms = document.querySelectorAll('.subscribe-form, .newsletter-form');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', handleSubmit);
    }
  });
})();
