const BolognaPiazzaMaggiore = { lat: 44.4939, lng: 11.3426 };
const CentralItaly = { lat: 41.9028, lng: 12.4964 };

let map;
let markers = [];
let selectedProductId = null;
let selectedStoreId = null;

async function loadAllData() {
  try {
    console.log("Loading data...");

    if (!stores) throw "Stores not provided";
    if (!products) throw "Products not provided";
    if (!inventory) throw "Inventory not provided";

    console.log("Successfully loaded data:", {
      stores: stores.length,
      products: products.length,
      inventoryKeys: Object.keys(inventory).length,
    });

    document.getElementById("loadingSection").style.display = "none";
    document.getElementById("mainContent").style.display = "block";

    initializeApp();
  } catch (error) {
    console.error("Failed loading data:", error);
    showError(error.message);
  }
}

function showError(message) {
  document.getElementById("loadingSection").style.display = "none";
  document.getElementById("errorSection").style.display = "block";
  document.getElementById("errorMessage").textContent = message;
}

function initializeApp() {
  loadProducts();
  loadStores();
  // initMap();
  // showAllStores();
  // updateStats();
}

function updateInfoPanelForProduct(productId) {
  const product = products.find((p) => p.id === productId);
  const storesWithProduct = isProductInStore(product);
  const totalQuantity = storesWithProduct.reduce(
    (total, store) => total + (inventory[store.id][productId] || 0),
    0
  );

  document.getElementById("infoPanel").innerHTML = `
    <strong>${product.name}</strong> - ${product.brand} - ${product.category} - ${product.price}<br>
    <strong>SKU:</strong> ${product.sku}<br>
    Stock available in <strong>${storesWithProduct.length}</strong> stores on ${stores.length}<br>
    Total stock: <strong>${totalQuantity}</strong> pieces
  `;
}

function updateInfoPanelForStore(storeId) {
  const store = store.find((s) => s.id === storeId);
  // TODO Make the same for store as updateInfoPanelForProduct for products

  document.getElementById("infoPanel").innerHTML = `
  `;
}

function initMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) throw "Map not provided";

  const config = {
    center: BolognaPiazzaMaggiore,
    zoom: 13,
  };

  map = new google.maps.Map(mapEl, config);
  infoWindow = new google.maps.InfoWindow();
}

function loadElement(
  kind,
  collection,
  selectFn,
  storesWithProductsFn,
  templateHtmlFn
) {
  const listId = `${kind}List`;
  const list = document.getElementById(listId);
  if (!list) throw "List not provided for " + listId;

  list.innerHTML = "";

  for (const element of collection) {
    const item = document.createElement("div");
    item.classList.add(`${kind}-item`);

    const isAvailable = element.available;
    if (!isAvailable) item.classList.add("unavailable");

    item.addEventListener("click", () => {
      if (!isAvailable) return;
      selectFn(element.id);
    });

    const storesWithProduct = storesWithProductsFn(element);

    item.innerHTML = templateHtmlFn(element, isAvailable, storesWithProduct);

    list.appendChild(item);
  }
}

function isProductInStore(product) {
  return stores.filter(
    (store) => inventory[store.id] && inventory[store.id][product.id]
  ).length;
}

function loadProducts() {
  loadElement(
    "product",
    products,
    selectProduct,
    isProductInStore,
    (product, isAvailable, storesWithProduct) =>
      `
      <div>
        <div><strong>${product.name}</strong></div>
        <div style="font-size: 11px; color: #666;">
          ${product.brand} - ${product.category} - ${product.price}
          ${!isAvailable ? " (Not available)" : ""}
        </div>
      </div>
      <div style="font-size: 12px; color: #666;">
        ${isAvailable ? `${storesWithProduct} stores` : "N/A"}
      </div>
    `
  );
}

function loadStores() {
  loadElement(
    "store",
    stores,
    selectStore,
    (store) => Object.entries(inventory[store.id]).length,
    (store, isAvailable, storesWithProduct) => `
      <div>
        <div><strong>${store.name}</strong></div>
        <div style="font-size: 11px; color: #666;">
          ${store.city} - ${store.address} - ${store.type}
          ${store.lat}, ${store.lng}
          ${!isAvailable ? " (Not available)" : ""}
        </div>
      </div>
      <div style="font-size: 12px; color: #666;">
        ${isAvailable ? `${storesWithProduct} products` : "N/A"}
      </div>
    `
  );
}

function selectProduct(productId) {
  selectedProductId = productId;

  const productItems = document.querySelectorAll(".product-item");
  if (!productItems) return;

  for (const productItem of productItems) {
    productItem.classList.remove("selected");
    if (productId === productItem.id) productItem.classList.add("selected");
  }

  showStoresForProduct(productId);
  updateInfoPanelForProduct(productId);
}

function selectStore(storeId) {
  selectedStoreId = storeId;

  const storeItems = document.querySelectorAll(".store-item");
  if (!storeItems) return;

  for (const storeItem of storeItems) {
    storeItem.classList.remove("selected");
    if (storeId === storeItem.id) storeItem.classList.add("selected");
  }

  showStoresForProduct(storeId);
  updateInfoPanelForStore(storeId);
}

function showStoresForProduct(productId) {
  clearMarkers();
  // TODO
}

function createCustomMarker(color) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}

function addCustomMarker(position, title, description, color) {
  const marker = new google.maps.Marker({
    position: position,
    map: map,
    title: title,
    icon: createCustomMarker(color),
    animation: google.maps.Animation.DROP,
  });

  marker.addListener("click", function () {
    infoWindow.setContent(`
      <div style="padding: 10px;">
          <h3 style="margin: 0 0 10px 0; color: ${color};">${title}</h3>
          <p style="margin: 0;">${description}</p>
          <small style="color: #666;">
            Lat: ${position.lat().toFixed(4)},
            Lng: ${position.lng().toFixed(4)}
          </small>
      </div>
    `);
    infoWindow.open(map, marker);
  });

  markers.push(marker);
  return marker;
}

function clearMarkers() {
  for (const marker of markers) marker.setMap(null);
  markers = [];
  infoWindow.close();
}

function centerOnBologna() {
  map.setCenter(BolognaPiazzaMaggiore);
  map.setZoom(13);
}

window.onload = function () {
  loadAllData().then(() => {
    const API_KEY = "TODO INSERT HERE YOUR API KEY";
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
};
