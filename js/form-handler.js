/**
 * Form Handler for GlucoseInsights Website
 *
 * Intercepts Webflow's broken form handling and routes the subscribe
 * form to Mailchimp. Webflow's JS (webflow.js) sends form data to
 * Webflow's servers, which returns 404 since the site is no longer
 * hosted on Webflow. This script uses capture-phase event listeners
 * to intercept submissions before Webflow's delegated handlers fire.
 */
(function () {
  'use strict';

  // ============================================================
  // MAILCHIMP CONFIGURATION
  // ============================================================
  var MAILCHIMP_URL = 'https://glucoseinsights.us22.list-manage.com/subscribe/post?u=b09e085a8d2f566b9138d4dc8&id=d4c6ab5867&f_id=0068e2e1f0';

  function submitToMailchimp(form) {
    var email = form.querySelector('input[type="email"]');
    if (!email || !email.value) return Promise.reject(new Error('Email required'));

    // Convert Mailchimp POST URL to JSONP-compatible GET URL
    var url = MAILCHIMP_URL.replace('/post?', '/post-json?');
    url += '&EMAIL=' + encodeURIComponent(email.value);
    url += '&tags=website_subscriber';

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

  function showSuccess(form, wrapper) {
    form.style.display = 'none';
    var successDiv = wrapper.querySelector('.w-form-done');
    var errorDiv = wrapper.querySelector('.w-form-fail');
    if (successDiv) successDiv.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';
  }

  function showError(form, wrapper) {
    var successDiv = wrapper.querySelector('.w-form-done');
    var errorDiv = wrapper.querySelector('.w-form-fail');
    if (successDiv) successDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'block';
  }

  function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    var form = e.target;
    var wrapper = form.closest('.w-form');
    if (!wrapper) return;

    // Honeypot check - if filled, a bot submitted the form
    var honeypot = form.querySelector('[name="bot-field"]');
    if (honeypot && honeypot.value) {
      showSuccess(form, wrapper);
      return;
    }

    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    submitToMailchimp(form)
      .then(function () {
        showSuccess(form, wrapper);
      })
      .catch(function () {
        showError(form, wrapper);
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var forms = document.querySelectorAll('.w-form form');
    for (var i = 0; i < forms.length; i++) {
      (function (form) {
        form.addEventListener('submit', handleSubmit, true);
      })(forms[i]);
    }
  });
})();
