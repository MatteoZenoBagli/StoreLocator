const BolognaPiazzaMaggiore = { lat: 44.4939, lng: 11.3426 };
const CentralItaly = { lat: 41.9028, lng: 12.4964 };

let map;
let markers = [];
let selectedProductId = null;
let selectedStoreId = null;

const elements = {
  infoPanel: null,
  mainContent: null,
  loadingSection: null,
  errorSection: null,
  errorMessage: null,
  productItems: null,
  storeItems: null,
  map: null,
};

async function loadAllData() {
  try {
    console.log("Finding elements...");

    elements.infoPanel = document.getElementById("infoPanel");
    if (!elements.infoPanel) throw "infoPanel not provided";

    elements.mainContent = document.getElementById("mainContent");
    if (!elements.mainContent) throw "mainContent not provided";

    elements.loadingSection = document.getElementById("loadingSection");
    if (!elements.loadingSection) throw "loadingSection not provided";

    elements.errorSection = document.getElementById("errorSection");
    if (!elements.errorSection) throw "errorSection not provided";

    elements.errorMessage = document.getElementById("errorMessage");
    if (!elements.errorMessage) throw "errorMessage not provided";

    elements.productItems = document.querySelectorAll(".product-item");
    if (!elements.productItems) throw "productItems not provided";

    elements.storeItems = document.querySelectorAll(".store-item");
    if (!elements.storeItems) throw "storeItems not provided";

    elements.map = document.getElementById("map");
    if (!elements.map) throw "Map not provided";

    console.log("Successfully found elements:", elements);

    console.log("Loading data...");

    if (!stores) throw "Stores not provided";
    if (!products) throw "Products not provided";
    if (!inventory) throw "Inventory not provided";

    console.log("Successfully loaded data:", {
      stores: stores.length,
      products: products.length,
      inventoryKeys: Object.keys(inventory).length,
    });

    elements.loadingSection.style.display = "none";
    elements.mainContent.style.display = "block";

    initializeApp();
  } catch (error) {
    console.error("Failed loading data:", error);
    showError(error.message);
  }
}

function showError(message) {
  elements.loadingSection.style.display = "none";
  elements.errorSection.style.display = "block";
  elements.errorMessage.textContent = message;
}

function initializeApp() {
  loadProducts();
  loadStores();
  // showAllStores();
  updateStats();
}

function updateInfoPanelForProduct(productId) {
  const product = products.find((p) => p.id === productId);
  const storesWithProduct = storesWithProductStock(product);
  const totalQuantity = storesWithProduct.reduce(
    (total, store) => total + (inventory[store.id][productId] || 0),
    0
  );

  elements.infoPanel.innerHTML = [
    `<strong>${product.name}</strong> - ${product.brand} - ${product.category} - ${product.price}`,
    `<strong>SKU:</strong> ${product.sku}`,
    `Stock available in ${storesWithProduct.length} stores on ${
      stores.length
    } (${(storesWithProduct.length / stores.length) * 100}%)`,
    `Total stock: ${totalQuantity} pieces`,
  ].join("<br>");
}

function updateInfoPanelForStore(storeId) {
  const store = stores.find((s) => s.id === storeId);
  const productsVarieties = productsVarietiesInStore(storeId);
  const totalProductsStockInStoreCount =
    0 !== Object.values(productsVarieties).length
      ? Object.values(productsVarieties).reduce(
          (a, b) => parseInt(a) + parseInt(b)
        )
      : 0;

  elements.infoPanel.innerHTML = [
    `<strong>${store.name}</strong> - ${store.city} - ${store.address} - ${store.type}`,
    `<strong>Coordinates:</strong> lat: ${store.position.lat}, lng: ${store.position.lng}`,
    `Products varieties: ${productsVarieties.length} products`,
    `Total products stock: ${totalProductsStockInStoreCount} pieces`,
  ].join("<br>");
}

async function initMap() {
  // Request needed libraries.
  const { Map, InfoWindow } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

  const config = {
    center: BolognaPiazzaMaggiore,
    zoom: 13,
    mapId: "map",
  };
  map = new Map(elements.map, config);
  infoWindow = new InfoWindow();

  for (const store of stores) {
    const pin = new PinElement();
    const marker = new AdvancedMarkerElement({
      position: store.position,
      map,
      title: store.name,
      content: pin.element,
      gmpClickable: true
    });

    marker.addListener('click', ({ domEvent, latLng }) => {
      const { target } = domEvent;
      infoWindow.close();
      infoWindow.setContent(marker.title);
      infoWindow.open(marker.map, marker);
    });

    markers.push(marker);
  }
}

function showAllStores() {
  console.log('TODO');
}

function showStoresWithProducts() {
  console.log('TODO');
}

function showEmptyStores() {
  console.log('TODO');
}

function updateStats() {
  const storesWithProducts = stores.filter(
    (store) =>
      inventory[store.id] && Object.keys(inventory[store.id]).length > 0
  ).length;

  const emptyStores = stores.length - storesWithProducts;

  const productsAvailable = products.filter(
    (product) =>
      product.available !== false &&
      stores.some(
        (store) => inventory[store.id] && inventory[store.id][product.id]
      )
  ).length;

  const unavailableProducts = products.filter(
    (product) => product.available === false
  ).length;

  const totalProducts = Object.values(inventory).reduce(
    (total, storeInventory) =>
      total + Object.values(storeInventory).reduce((sum, qty) => sum + qty, 0),
    0
  );

  document.getElementById("stats").innerHTML = `
    <h2>Stats</h2>
    <div>
      <strong>Stores:</strong> ${stores.length} total
      <ul>
        <li class="green">With products: ${storesWithProducts}</li>
        <li class="red">Empty: ${emptyStores}</li>
      </ul>
    </div>
    <div>
      <strong>Products:</strong> ${products.length} total
      <ul>
        <li class="green">Available: ${productsAvailable}</li>
        <li class="red">Not available: ${unavailableProducts}</li>
      </ul>
    </div>
    <div><strong>Total stock:</strong> ${totalProducts} pieces</div>
  `;
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

function storesWithProductStock(product) {
  return stores.filter(
    (store) => inventory[store.id] && inventory[store.id][product.id]
  );
}

function isProductInStore(product) {
  return 0 < storesWithProductStock(product).length;
}

function loadProducts() {
  loadElement(
    "product",
    products,
    selectProduct,
    storesWithProductStock,
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
        ${isAvailable ? `${storesWithProduct.length} stores` : "N/A"}
      </div>
    `
  );
}

function loadStores() {
  loadElement(
    "store",
    stores,
    selectStore,
    (store) => productsVarietiesInStore(store.id),
    (store, isAvailable, storesWithProduct) => `
      <div>
        <div><strong>${store.name}</strong></div>
        <div style="font-size: 11px; color: #666;">
          ${store.city} - ${store.address} - ${store.type}
          ${store.position.lat}, ${store.position.lng}
          ${!isAvailable ? " (Not available)" : ""}
        </div>
      </div>
      <div style="font-size: 12px; color: #666;">
        ${isAvailable ? `${storesWithProduct.length} products` : "N/A"}
      </div>
    `
  );
}

function productsVarietiesInStore(storeId) {
  return Object.entries(inventory[storeId]);
}

function selectProduct(productId) {
  selectedProductId = productId;

  for (const productItem of elements.productItems) {
    productItem.classList.remove("selected");
    if (productId === productItem.id) productItem.classList.add("selected");
  }

  showStoresForProduct(productId);
  updateInfoPanelForProduct(productId);
}

function selectStore(storeId) {
  selectedStoreId = storeId;

  for (const storeItem of elements.storeItems) {
    storeItem.classList.remove("selected");
    if (storeId === storeItem.id) storeItem.classList.add("selected");
  }

  updateInfoPanelForStore(storeId);
}

function showStoresForProduct(productId) {
  clearMarkers();
  // TODO
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap&libraries=marker`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
};
