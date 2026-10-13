(function() {
  const DEBUG = false;
  const log = (...args) => { if (DEBUG) console.log('[Mercari Warning]', ...args); };

  const warningTitle = chrome.i18n.getMessage('warningTitle') || 'Pay on Delivery';
  const warningMessage = chrome.i18n.getMessage('warningMessage') || 'This item is cash on delivery.';
  const closeWarningAriaLabel = chrome.i18n.getMessage('closeWarningAriaLabel') || 'Close warning';

  const WARNING_ID = 'mercari-warning-box';

  // Labels for the "who pays shipping" row on the item page.
  const SHIPPING_LABELS = ['配送料の負担', 'Shipping cost'];

  // Values that mean the buyer pays on delivery.
  const PAY_ON_DELIVERY_TERMS = [
    '着払い',
    '代引き',
    '代金引換',
    'paid on delivery',
    'payment on delivery',
    'pay on delivery',
    'cash on delivery'
  ];

  // Keep re-checking this long after a navigation, since Mercari renders
  // the item details asynchronously.
  const CHECK_DURATION_MS = 15000;
  const THROTTLE_MS = 400;

  let currentUrl = null;
  let urlChangedAt = 0;
  let dismissedUrl = null;
  let pendingCheck = null;

  function isItemPage() {
    return /\/item\/[^/]+/.test(window.location.pathname);
  }

  // Returns true/false once the shipping row is found, or null if it hasn't
  // rendered yet. Only the value next to the label is inspected, so words
  // in the item description or recommended items can't cause a false alarm.
  function detectPayOnDelivery() {
    const pageText = document.body.innerText;
    let labelFound = false;

    for (const label of SHIPPING_LABELS) {
      let index = pageText.indexOf(label);
      while (index !== -1) {
        labelFound = true;
        const start = index + label.length;
        // The value is the first non-empty line after the label.
        const value = (pageText.slice(start).split('\n').map(line => line.trim()).find(Boolean) || '').toLowerCase();
        if (PAY_ON_DELIVERY_TERMS.some(term => value.includes(term))) {
          return true;
        }
        index = pageText.indexOf(label, start);
      }
    }

    return labelFound ? false : null;
  }

  function showWarning() {
    if (document.getElementById(WARNING_ID)) {
      return;
    }

    const warningBox = document.createElement('div');
    warningBox.id = WARNING_ID;
    warningBox.className = 'mercari-warning';
    warningBox.setAttribute('role', 'alert');

    const header = document.createElement('div');
    header.className = 'mercari-warning-header';

    const title = document.createElement('span');
    title.className = 'mercari-warning-title';
    title.textContent = warningTitle;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mercari-warning-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', closeWarningAriaLabel);
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function() {
      dismissedUrl = currentUrl;
      removeWarning();
    });

    const content = document.createElement('div');
    content.className = 'mercari-warning-content';
    content.textContent = warningMessage;

    header.append(title, closeBtn);
    warningBox.append(header, content);
    document.body.appendChild(warningBox);
  }

  function removeWarning() {
    const existing = document.getElementById(WARNING_ID);
    if (existing) {
      existing.remove();
    }
  }

  function check() {
    pendingCheck = null;

    // Mercari is a single-page app, so the URL changes without a page reload.
    if (window.location.href !== currentUrl) {
      log('URL changed:', window.location.href);
      currentUrl = window.location.href;
      urlChangedAt = Date.now();
      removeWarning();
    }

    if (!isItemPage() || Date.now() - urlChangedAt > CHECK_DURATION_MS) {
      return;
    }

    const result = detectPayOnDelivery();
    log('Pay on delivery:', result);

    if (result === true && dismissedUrl !== currentUrl) {
      showWarning();
    } else if (result === false) {
      removeWarning();
    }
  }

  function scheduleCheck() {
    if (pendingCheck === null) {
      pendingCheck = setTimeout(check, THROTTLE_MS);
    }
  }

  const observer = new MutationObserver(function() {
    if (window.location.href !== currentUrl || Date.now() - urlChangedAt <= CHECK_DURATION_MS) {
      scheduleCheck();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  window.addEventListener('popstate', scheduleCheck);
  check();
})();
