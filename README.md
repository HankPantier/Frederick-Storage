# Frederick Storage: temporary site

A coming-soon site for **frederick-storage.com**, hosted on GitHub Pages until the full Hummingbird site is ready. It has no build step: plain HTML, CSS and JavaScript.

| Path | What it is |
|---|---|
| `/` | Coming-soon home page with a link to the giveaway |
| `/contact-us/` | Holiday giveaway entry form. The holiday magnet's QR code lands here (`?utm_source=holiday-3-free`) |
| `/contact/` | Redirects to `/contact-us/` and keeps any tracking tags |
| `/rules/` | Official giveaway rules. **Draft: the `[BRACKETED]` values need confirming before launch** |
| `404.html` | Not-found page |

Form entries go to a Google Sheet owned by **frederickcostorage@gmail.com**. They get there through a small Google Apps Script web app (`apps-script/Code.gs`). Each entry:

- adds a row to the sheet, with the time, the form answers, `utm_source`/`utm_medium`/`utm_campaign`, and a "Repeat entry" flag when the email has entered before
- emails the owner
- sends the entrant a short "You're entered" confirmation (first entry only)

Brand: Design System V2 (Logo A, P2 palette with Ink, Libre Franklin, self-hosted in `assets/fonts/`).

---

## 1. Connect the Google Sheet (one time, about 5 minutes)

Do this while signed in to Google as **frederickcostorage@gmail.com**.

1. Create a new Google Sheet named **Frederick Storage Giveaway Entries**.
2. In the sheet, open **Extensions › Apps Script**. Delete what's in `Code.gs` and paste in the contents of `apps-script/Code.gs` from this repo. Save.
3. In the function menu at the top, choose **`setup`** and click **Run**. Google asks for permission: click **Review permissions**, choose the account, then **Advanced › Go to project (unsafe) › Allow**. That warning appears because this is your own unpublished script. Afterwards the sheet has an **Entries** tab with headers.
4. Click **Deploy › New deployment**. Choose the type **Web app**, set **Execute as: Me** and **Who has access: Anyone**, then click **Deploy**. Copy the **Web app URL**, which ends in `/exec`.
5. Paste that URL into `assets/js/config.js` as `endpoint`, then commit and push.
6. Submit a test entry on the live site. Check that a row appears and that both emails arrive. Then delete the test row.

**Changing the script later:** after editing, use **Deploy › Manage deployments › (pencil) › Version: New version › Deploy**. This keeps the same URL, so `config.js` doesn't change.

## 2. GitHub Pages and the domain

- Pages serves the `main` branch from the root. `CNAME` already says `frederick-storage.com`.
- At the domain registrar, point the apex domain at GitHub Pages with four `A` records:
  `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  (plus `AAAA` records `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` and `2606:50c0:8003::153` if the registrar supports them).
- Add a `CNAME` record for `www` pointing to `hankpantier.github.io`.
- Once the certificate is issued, tick **Enforce HTTPS** in the repo's Settings › Pages.
- Keep `frederick-storage.com` (no www) as the main address. The magnet's QR code uses it. On the old Squarespace setup, the redirect to www dropped the tracking tag.

## 3. Before launch

- [ ] Steve confirms the rules (address, ZIP, start date, prize value, and every default) and someone gives them a legal read.
- [ ] `assets/js/config.js` has the Apps Script URL, and a live test entry works.
- [ ] Scan a printed magnet with a phone and confirm it lands on the form with the tag.

## Drawing the winner

In the sheet, filter out rows where **Repeat entry** is "Yes". Pick a random row, for example with `=INDEX(FILTER(D2:D, I2:I<>"Yes"), RANDBETWEEN(1, COUNTA(FILTER(D2:D, I2:I<>"Yes"))))`. Note the result before you edit the sheet again, because the formula re-rolls on every change.
