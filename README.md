# Moving Sale Website

This is a GitHub Pages-ready static website for a friendly move-out sale. You edit one file, `items.json`, add photos to `images/`, and GitHub Pages publishes the catalog.

## What To Edit

- `items.json`: sale title, pickup window, optional WhatsApp number, and item listings.
- `images/`: your real item photos.
- `styles.css`: colors and layout, only if you want to customize the design.

## Add Your Real Items

1. Put your photos in `images/`.
2. Use simple lowercase names with hyphens, like `images/dining-table-1.jpg`.
3. Open `items.json`.
4. Copy one sample item object and replace the values.
5. Keep `status` as one of: `available`, `reserved`, or `sold`.
6. Save the file.

Example item:

```json
{
  "id": "dining-table",
  "title": "Dining table with 4 chairs",
  "category": "Furniture",
  "status": "available",
  "description": "Light wood table, seats four, minor mark on one corner.",
  "askingPrice": 250,
  "originalPrice": 800,
  "negotiable": true,
  "bought": "June 2022",
  "condition": "Good",
  "pickup": "Pickup around 8-10 August",
  "listedOn": "2026-07-11",
  "link": "https://example.com/original-product-link",
  "images": [
    "images/dining-table-1.jpg",
    "images/dining-table-2.jpg"
  ],
  "imageAlt": "Dining table with four chairs"
}
```

JSON is picky: use double quotes, separate items with commas, and do not leave a comma after the final item.

## Add One Or Two Photos

Yes, one item can have one photo, two photos, or more.

One photo:

```json
"images": [
  "images/dining-table-1.jpg"
]
```

Two photos:

```json
"images": [
  "images/dining-table-1.jpg",
  "images/dining-table-2.jpg"
]
```

The card shows the first photo. The details view shows the extra photos.

## WhatsApp Number

You do not need to put your WhatsApp number on the public website.

Recommended for privacy: leave this blank:

```json
"whatsappNumber": ""
```

Then people can use the site link from the WhatsApp group and message you directly in that group/private chat.

If you do want every visitor to be able to message you directly, set:

```json
"whatsappNumber": "15551234567"
```

Use country code and numbers only. Do not include `+`, spaces, or brackets.

## Good Wording

For the site:

> I am checking what people are interested in before I move. Items can be reserved now, but pickup is only around 8-10 August.

For WhatsApp groups:

> Hi everyone, I am moving soon and checking interest for a few home items here: YOUR_WEBSITE_LINK. Pickup would be around 8-10 August. First message, first reserved, and I will update items as reserved or sold.

## Preview Locally

From this folder, run:

```bash
python3 -m http.server 8076
```

Then open:

```text
http://localhost:8076
```

## Publish On GitHub Pages

1. Go to GitHub and create a new repository. A name like `moving-sale` is fine.
2. Upload these files to the repository root: `index.html`, `styles.css`, `app.js`, `items.json`, `.nojekyll`, and the `images/` folder.
3. Open the repository on GitHub.
4. Go to `Settings` -> `Pages`.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Set branch to `main` and folder to `/(root)`.
7. Click `Save`.
8. Wait a few minutes, then use the published link shown in `Settings` -> `Pages`.

GitHub says Pages can publish static files from the repository root, and changes may take up to 10 minutes to appear.

Official docs:

- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Update After Someone Reserves

Change the item status in `items.json`:

```json
"status": "reserved"
```

When it is paid for or collected, change it to:

```json
"status": "sold"
```

Commit the change on GitHub. The website will update after GitHub Pages republishes.

## Privacy Tips

- Use your area or building name, not your full apartment number.
- Check photos for mirrors, documents, mail, or anything private.
- Share exact pickup details only after confirming by WhatsApp.
- Leave `whatsappNumber` blank if the site is mainly for people in groups where they already know how to message you.
