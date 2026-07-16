const state = {
  items: [],
  config: {},
  status: "all",
  sort: "recommended",
};

const statusRank = {
  available: 0,
  reserved: 1,
  sold: 2,
};

const catalog = document.querySelector("#catalog");
const emptyState = document.querySelector("#empty-state");
const itemCount = document.querySelector("#item-count");
const lastUpdated = document.querySelector("#last-updated");
const template = document.querySelector("#item-card-template");
const dialog = document.querySelector("#item-dialog");
const dialogContent = document.querySelector("#dialog-content");
const toast = document.querySelector("#toast");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindControls();

  try {
    const response = await fetch("items.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load items.json");
    const data = await response.json();
    state.config = data.config || {};
    state.items = Array.isArray(data.items) ? data.items : [];
    renderConfig();
    renderItems();
    highlightHashItem();
  } catch (error) {
    catalog.innerHTML = "";
    itemCount.textContent = "Could not load the item list.";
    emptyState.hidden = false;
    console.error(error);
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderCardPhotos(imageWrap, image, fallback, images, item, cardIndex) {
  if (!images.length) {
    image.hidden = true;
    fallback.hidden = false;
    return;
  }

  image.src = images[0];
  image.alt = item.imageAlt || `${item.title} photo`;
  image.loading = cardIndex === 0 ? "eager" : "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  });
}

function bindControls() {
  document.querySelector("#sort-select").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderItems();
  });

  document.querySelectorAll("[data-status]").forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      document.querySelectorAll("[data-status]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      renderItems();
    });
  });

  const copySaleLink = document.querySelector("#copy-sale-link");
  if (copySaleLink) {
    copySaleLink.addEventListener("click", () => {
      copyText(cleanPageUrl(), "Sale link copied");
    });
  }

  document.querySelector("#close-dialog").addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  window.addEventListener("hashchange", highlightHashItem);
}

function renderConfig() {
  const config = state.config;
  document.title = config.title || "Moving Sale";
  setText("#sale-kicker", config.kicker || "Home moving sale");
  setCrayonTitle(config.title || "Moving Sale");
  setText("#sale-note", config.note || "First message, first reserved. Pickup details shared by WhatsApp.");
  setText("#pickup-from", config.pickupFrom || "Soho Square Saadiyat Island");
  setText("#pickup-area", config.pickupArea || "Area shared after reservation");
  setText("#sale-deadline", config.deadline || "Moving soon");
  setText("#reservation-policy", config.reservationPolicy || "First message, first reserved");
  setText("#footer-note", config.footerNote || "");

  const shareText = buildShareText();
  const whatsappLink = document.querySelector("#whatsapp-link");
  if (whatsappLink) {
    whatsappLink.href = whatsappUrl(shareText);
    whatsappLink.querySelector("span").textContent = hasWhatsappNumber() ? "WhatsApp me" : "Share";
    whatsappLink.setAttribute("aria-label", hasWhatsappNumber() ? "Message me on WhatsApp" : "Share this sale on WhatsApp");
  }
}

function renderItems() {
  const visibleItems = getVisibleItems();
  catalog.innerHTML = "";

  visibleItems.forEach((item, index) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.id = item.id;
    card.dataset.status = item.status || "available";

    const images = getImages(item);
    const imageWrap = card.querySelector(".image-wrap");
    const image = card.querySelector(".item-image");
    const fallback = card.querySelector(".image-fallback");
    renderCardPhotos(imageWrap, image, fallback, images, item, index);
    imageWrap.setAttribute("role", "button");
    imageWrap.setAttribute("tabindex", "0");
    imageWrap.setAttribute("aria-label", `Open details for ${item.title || "this item"}`);
    imageWrap.title = "Open details";
    imageWrap.addEventListener("click", () => openDetails(item));
    imageWrap.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetails(item);
      }
    });

    const status = normalizeStatus(item.status);
    const statusChip = card.querySelector(".status-chip");
    statusChip.textContent = statusLabel(status);
    statusChip.classList.add(status);

    const photoCount = card.querySelector(".photo-count");
    if (images.length > 1) {
      photoCount.hidden = false;
      photoCount.textContent = `${images.length} photos`;
    }

    card.querySelector(".item-category").textContent = item.category || "Home item";
    card.querySelector(".item-title").textContent = item.title || "Untitled item";
    card.querySelector(".price").textContent = formatPrice(item.askingPrice, item.currency);
    card.querySelector(".item-description").textContent = item.description || "";

    renderFacts(card.querySelector(".item-facts"), item);

    card.querySelector(".view-details").addEventListener("click", () => openDetails(item));

    const originalLink = card.querySelector(".original-link");
    if (item.link) {
      originalLink.href = item.link;
      originalLink.hidden = false;
      originalLink.setAttribute("aria-label", `Open item link for ${item.title}`);
    } else {
      originalLink.remove();
    }

    const askLink = card.querySelector(".ask-link");
    askLink.href = whatsappUrl(buildItemMessage(item));
    askLink.setAttribute("aria-label", `Ask about ${item.title}`);
    askLink.querySelector("span").textContent = hasWhatsappNumber() ? "Ask" : "Ask text";

    card.querySelector(".copy-item-link").addEventListener("click", () => {
      copyText(itemUrl(item.id), "Item link copied");
    });

    catalog.append(card);
  });

  const available = state.items.filter((item) => normalizeStatus(item.status) === "available").length;
  itemCount.textContent = `${visibleItems.length} shown, ${available} available`;
  lastUpdated.textContent = state.config.lastUpdated ? `Updated ${state.config.lastUpdated}` : "";
  emptyState.hidden = visibleItems.length !== 0;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function getVisibleItems() {
  return state.items
    .filter((item) => {
      return state.status === "all" || normalizeStatus(item.status) === state.status;
    })
    .sort((a, b) => {
      if (state.sort === "price-low") return Number(a.askingPrice || 0) - Number(b.askingPrice || 0);
      if (state.sort === "price-high") return Number(b.askingPrice || 0) - Number(a.askingPrice || 0);
      if (state.sort === "newest") return new Date(b.listedOn || 0) - new Date(a.listedOn || 0);

      const statusDiff = statusRank[normalizeStatus(a.status)] - statusRank[normalizeStatus(b.status)];
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.listedOn || 0) - new Date(a.listedOn || 0);
    });
}

function renderFacts(container, item) {
  container.innerHTML = "";
  const facts = [
    ["Original price", formatPrice(item.originalPrice, item.currency)],
    ["Bought", item.bought || "Not sure"],
    ["Condition", item.condition || "Good"],
    ["Negotiable", item.negotiable ? "Yes" : "No"],
  ];

  facts.forEach(([label, value]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    row.append(dt, dd);
    container.append(row);
  });
}

function openDetails(item) {
  const images = getImages(item);
  dialogContent.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "dialog-grid";

  const gallery = document.createElement("div");
  gallery.className = "dialog-gallery";

  const photoWrap = document.createElement("div");
  photoWrap.className = "dialog-photo-wrap";

  if (images[0]) {
    const image = document.createElement("img");
    image.className = "dialog-photo";
    image.src = images[0];
    image.alt = item.imageAlt || `${item.title} photo`;
    image.loading = "eager";
    image.decoding = "async";
    photoWrap.append(image);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "image-fallback";
    fallback.textContent = "Photo coming soon";
    photoWrap.append(fallback);
  }

  gallery.append(photoWrap);

  if (images.length > 1) {
    const thumbs = document.createElement("div");
    thumbs.className = "dialog-thumbs";
    images.slice(0, 8).forEach((src, index) => {
      const thumb = document.createElement("img");
      thumb.src = src;
      thumb.alt = `${item.title} photo ${index + 1}`;
      thumb.loading = "lazy";
      thumb.decoding = "async";
      thumb.addEventListener("click", () => {
        const mainImage = photoWrap.querySelector("img");
        if (mainImage) mainImage.src = src;
      });
      thumbs.append(thumb);
    });
    gallery.append(thumbs);
  }

  const copy = document.createElement("div");
  copy.className = "dialog-copy";
  copy.append(textEl("p", item.category || "Home item", "item-category"));
  copy.append(textEl("h2", item.title || "Untitled item"));
  copy.append(textEl("p", item.description || ""));
  copy.append(textEl("div", formatPrice(item.askingPrice, item.currency), "dialog-price"));

  const facts = document.createElement("dl");
  facts.className = "dialog-facts";
  renderFacts(facts, item);
  addFact(facts, "Status", statusLabel(normalizeStatus(item.status)));
  if (images.length > 1) addFact(facts, "Photos", `${images.length} photos`);
  if (item.pickup) addFact(facts, "Pickup", item.pickup);
  copy.append(facts);

  const actions = document.createElement("div");
  actions.className = "dialog-actions";
  actions.append(actionLink(hasWhatsappNumber() ? "Ask on WhatsApp" : "Share ask text", whatsappUrl(buildItemMessage(item)), "message-circle"));
  actions.append(actionButton("Copy ask text", "copy", () => copyText(buildItemMessage(item), "Ask text copied")));
  actions.append(actionButton("Copy item link", "link", () => copyText(itemUrl(item.id), "Item link copied")));
  if (item.link) {
    actions.append(actionLink("Original link", item.link, "external-link"));
  }
  copy.append(actions);

  grid.append(gallery, copy);
  dialogContent.append(grid);
  dialog.showModal();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function addFact(container, label, value) {
  const row = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = label;
  dd.textContent = value;
  row.append(dt, dd);
  container.append(row);
}

function actionLink(label, href, icon) {
  const link = document.createElement("a");
  link.className = "action-button small";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i><span></span>`;
  link.querySelector("span").textContent = label;
  return link;
}

function actionButton(label, icon, onClick) {
  const button = document.createElement("button");
  button.className = "action-button small";
  button.type = "button";
  button.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i><span></span>`;
  button.querySelector("span").textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function textEl(tag, text, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function getImages(item) {
  if (!Array.isArray(item.images)) return [];
  return item.images.filter(Boolean);
}

function formatPrice(value, currency = state.config.currencySymbol || "$") {
  if (value === null || value === undefined || value === "") return "Ask";
  const number = Number(value);
  const amount = Number.isFinite(number) ? number.toLocaleString() : String(value);
  return `${currency}${amount}`;
}

function normalizeStatus(status) {
  if (status === "reserved" || status === "sold") return status;
  return "available";
}

function statusLabel(status) {
  if (status === "reserved") return "Reserved";
  if (status === "sold") return "Sold";
  return "Available";
}

function buildShareText() {
  const config = state.config;
  const fallback = `Hi! I am moving soon and checking interest for a few home items here: ${cleanPageUrl()} Pickup would be around 8-10 August. First message, first reserved.`;
  return (config.shareText || fallback).replaceAll("WEBSITE_LINK", cleanPageUrl());
}

function buildItemMessage(item) {
  const title = item.title || "this item";
  return `Hi, I am interested in ${title} from your move-out sale. I know pickup is around 8-10 August. Is it still available? ${itemUrl(item.id)}`;
}

function whatsappUrl(text) {
  const phone = String(state.config.whatsappNumber || "").replace(/\D/g, "");
  if (phone) return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

function hasWhatsappNumber() {
  return Boolean(String(state.config.whatsappNumber || "").replace(/\D/g, ""));
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast(message);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2100);
}

function itemUrl(id) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = id || "";
  return url.href;
}

function cleanPageUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.href;
}

function highlightHashItem() {
  const id = decodeURIComponent(window.location.hash.replace("#", ""));
  document.querySelectorAll(".item-card.is-highlighted").forEach((card) => {
    card.classList.remove("is-highlighted");
  });
  if (!id) return;
  const card = document.getElementById(id);
  if (!card) return;
  card.classList.add("is-highlighted");
  card.scrollIntoView({ block: "center" });
}

function setText(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

function setCrayonTitle(text) {
  const element = document.querySelector("#sale-title .crayon-title-text");
  if (!element) return;
  element.textContent = text;
}
