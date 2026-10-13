Simple extension so I don't accidentally buy something without knowing its pay on delivery.

## Testing locally

1. Go to `chrome://extensions` and turn on **Developer mode** (top right).
2. Click **Load unpacked** and select this folder.
3. Open a Mercari item that is 着払い and one that is 送料込み to check the warning shows only on the first.
4. After editing files, click the reload icon on the extension card, then refresh the Mercari tab.

Turn off the Web Store version while testing so the two copies don't both run.

## Publishing an update

1. Bump `version` in `manifest.json` (it must be higher than the published version).
2. Build the zip from the repo root:

   ```sh
   zip -r mercari-warning.zip manifest.json content.js warning.css icons _locales
   ```

3. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), select the extension, go to **Package** → **Upload new package**, and choose the zip.
4. Click **Submit for review**. Once it's approved, Chrome updates installed copies automatically.
