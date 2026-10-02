/* ==========================================================================
   CINDER & CEDAR COFFEE ROASTERS — DATA LAYER (data.js)
   Single Source of Truth for Brand, Catalog, Story, Reviews & FAQs
   ========================================================================== */

/**
 * BRAND SPECIFICATION
 * Defined ONCE and referenced across the entire application.
 */
const BRAND = Object.freeze({
  name: "Cinder & Cedar Coffee Roasters",
  tagline: "Roasted Slow. Poured Right.",
  address: "1820 Cedar Row, Suite 4, Portland, OR 97214",
  phone: "(503) 555-0148",
  phoneTel: "tel:+15035550148",
  email: "hello@cinderandcedar.example",
  pickupHours: "Wednesday–Sunday 8:00 AM–3:00 PM",
  freeShippingThresholdCents: 4000, // $40.00
  standardShippingFeeCents: 595,    // $5.95
  promoCode: "WELCOME10",
  promoDiscountPercent: 10,
  subscriptionDiscountPercent: 10,
  disclaimer: "Portfolio concept project. Cinder & Cedar Coffee Roasters is a fictional company; all products, reviews, prices and details are illustrative. No payments are processed.",
  formEndpoint: "",  // Demo mode when empty string
  orderEndpoint: "", // Demo mode when empty string
  storageKey: "cc_cart_v1"
});

/**
 * CURRENCY FORMATTER
 * Formats integer cents into standard USD currency string.
 * Example: 1900 -> "$19.00"
 */
function formatMoney(cents) {
  const dollars = (cents || 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(dollars);
}

/**
 * STANDARD GRIND OPTIONS
 */
const GRIND_OPTIONS = Object.freeze([
  "Whole bean",
  "Espresso",
  "Filter",
  "French press"
]);

/**
 * COFFEE CATALOG (PRODUCTS)
 * Money is strictly stored as integer cents.
 * Soft wording only: no forbidden words ("best", "freshest", "guaranteed", etc.)
 */
const PRODUCTS = Object.freeze([
  {
    id: 1,
    name: "Ethiopia Guji",
    category: "Single Origin",
    categorySlug: "single-origin",
    prices: {
      "12 oz": 1900, // $19.00
      "2 lb": 4400   // $44.00
    },
    roast: 1,
    roastDisplay: "Light Roast (1/5)",
    tastingNotes: ["blueberry", "jasmine", "honey"],
    bagColor: "#7B3F61",
    accentColor: "#EADFCC",
    origin: "Guji Highlands, Ethiopia",
    elevation: "1,950m – 2,150m",
    process: "Washed & Raised Bed Dried",
    description: "A delicate washed harvest grown in volcanic red clay. Displays distinct floral jasmine aromatics, wild blueberry sweetness, and clean honey finish."
  },
  {
    id: 2,
    name: "Colombia Huila",
    category: "Single Origin",
    categorySlug: "single-origin",
    prices: {
      "12 oz": 1700, // $17.00
      "2 lb": 3900   // $39.00
    },
    roast: 2,
    roastDisplay: "Medium-Light Roast (2/5)",
    tastingNotes: ["caramel", "red apple", "cocoa"],
    bagColor: "#B5651D",
    accentColor: "#F6F0E6",
    origin: "Huila Region, Colombia",
    elevation: "1,600m – 1,800m",
    process: "Extended Fermentation Washed",
    description: "Carefully harvested by smallholder families along the Andean slopes. A comforting cup featuring sweet brown caramel, crisp red apple acidity, and a smooth milk cocoa finish."
  },
  {
    id: 3,
    name: "Guatemala Antigua",
    category: "Single Origin",
    categorySlug: "single-origin",
    prices: {
      "12 oz": 1800, // $18.00
      "2 lb": 4100   // $41.00
    },
    roast: 3,
    roastDisplay: "Medium Roast (3/5)",
    tastingNotes: ["dark chocolate", "orange peel", "almond"],
    bagColor: "#3F6B4F",
    accentColor: "#F6F0E6",
    origin: "Antigua Valley, Guatemala",
    elevation: "1,500m – 1,700m",
    process: "Fully Washed & Patio Sun-Dried",
    description: "Grown in mineral-dense volcanic soil framed by three peaks. Balances nuanced bittersweet chocolate with subtle candied orange peel and roasted almond notes."
  },
  {
    id: 4,
    name: "Kenya Nyeri",
    category: "Single Origin",
    categorySlug: "single-origin",
    prices: {
      "12 oz": 2100, // $21.00
      "2 lb": 4800   // $48.00
    },
    roast: 2,
    roastDisplay: "Medium-Light Roast (2/5)",
    tastingNotes: ["blackcurrant", "grapefruit", "brown sugar"],
    bagColor: "#A3302B",
    accentColor: "#EADFCC",
    origin: "Nyeri Hill Slopes, Kenya",
    elevation: "1,750m – 1,900m",
    process: "Double Washed, Soaked & Sun-Dried",
    description: "Select SL-28 and SL-34 lots yielding high phosphoric brightness. Features deep tart blackcurrant, juicy ruby grapefruit, and dense muscovado sweetness."
  },
  {
    id: 5,
    name: "Ember House Blend",
    category: "Blend",
    categorySlug: "blend",
    prices: {
      "12 oz": 1600, // $16.00
      "2 lb": 3600   // $36.00
    },
    roast: 3,
    roastDisplay: "Medium Roast (3/5)",
    tastingNotes: ["toffee", "hazelnut", "cocoa"],
    bagColor: "#C2512A",
    accentColor: "#F6F0E6",
    origin: "Central & South America Seasonal Lots",
    elevation: "1,400m – 1,750m",
    process: "Washed Lots Roasted in Harmony",
    description: "Our signature roastery pairing. Developed for comforting daily filter brewing with warm buttery toffee sweetness, toasted hazelnut, and cocoa nibs."
  },
  {
    id: 6,
    name: "Cinder Espresso Blend",
    category: "Blend",
    categorySlug: "blend",
    prices: {
      "12 oz": 1700, // $17.00
      "2 lb": 3900   // $39.00
    },
    roast: 5,
    roastDisplay: "Dark Roast (5/5)",
    tastingNotes: ["dark chocolate", "molasses", "toasted nut"],
    bagColor: "#2A1A12",
    accentColor: "#EADFCC",
    origin: "Latin America & Pacific Regional Selection",
    elevation: "1,200m – 1,600m",
    process: "Washed & Natural Combined Roast",
    description: "Developed specifically for espresso portafilters and milk pairings. Rich, dense, and full-bodied with lingering dark chocolate, blackstrap molasses, and toasted pecan."
  },
  {
    id: 7,
    name: "Sunday Decaf",
    category: "Decaf",
    categorySlug: "decaf",
    prices: {
      "12 oz": 1800, // $18.00
      "2 lb": 4100   // $41.00
    },
    roast: 3,
    roastDisplay: "Medium Roast (3/5)",
    tastingNotes: ["brown sugar", "cherry", "cocoa"],
    bagColor: "#5C7A8A",
    accentColor: "#F6F0E6",
    origin: "Valle del Cauca, Colombia",
    elevation: "1,450m – 1,700m",
    process: "Sugarcane Mountain Water Decaffeination",
    description: "Gentle natural decaffeination that honors the cup profile. Unwinds with warm brown sugar, dried red cherry notes, and a satisfying sweet cocoa finish without the caffeine kick."
  },
  {
    id: 8,
    name: "Tasting Trio Gift Set",
    category: "Gift Sets",
    categorySlug: "gift-sets",
    prices: {
      "Three 8 oz bags": 4800 // $48.00 (one size only)
    },
    roast: 3,
    roastDisplay: "Varies (Roast 2 to 4)",
    tastingNotes: ["variety"],
    bagColor: "#C9A227",
    accentColor: "#2A1A12",
    origin: "Three Single Origin Selections",
    elevation: "Various Mountain Lots",
    process: "Curated Variety Set",
    description: "A boxed collection containing three 8 oz bags across varying roast styles and flavor profiles. Perfect for discovering origin nuances side-by-side."
  }
]);

/**
 * TASTING NOTES TICKER ROWS
 */
const TASTING_NOTES_ROW_1 = Object.freeze([
  "Blueberry Sweetness",
  "Candied Jasmine",
  "Toasted Hazelnut",
  "Dark Chocolate",
  "Citrus Blossom",
  "Wild Honey",
  "Brown Butter Caramel",
  "Ruby Grapefruit"
]);

const TASTING_NOTES_ROW_2 = Object.freeze([
  "Sugarcane Finish",
  "Blackcurrant Crispness",
  "Roasted Almond",
  "Molasses & Crema",
  "Spiced Orange Peel",
  "Sweet Red Apple",
  "Velvety Cocoa",
  "Stone Fruit Acidity"
]);

/**
 * FROM FARM TO CUP — 4 PINNED HORIZONTAL PANELS
 * Big numbers and crisp geometric SVG icons (no external photo assets).
 */
const FARM_TO_CUP_STEPS = Object.freeze([
  {
    number: "01",
    title: "Source",
    tagline: "High-Altitude Micro-Lots",
    description: "We work directly with smallholder producer groups farming above 1,500 meters, selecting slow-ripening shade cherries cultivated with intentional care.",
    iconSvg: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 38l12-18 8 10 16-20"/><circle cx="36" cy="12" r="4"/><path d="M4 42h40"/></svg>`
  },
  {
    number: "02",
    title: "Roast",
    tagline: "Small-Batch Cast Iron Drum",
    description: "Roasted in 12-kilo batches in our Portland warehouse. We monitor airflow and thermal rate of rise to honor each origin's inherent botanical character.",
    iconSvg: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 6c-3 8-10 12-10 20a10 10 0 0 0 20 0c0-8-7-12-10-20z"/><path d="M24 22c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8z"/></svg>`
  },
  {
    number: "03",
    title: "Rest",
    tagline: "Targeted Degassing Phase",
    description: "Every roast rests in oxygen-controlled bins for 48 hours to release excess carbon dioxide before packaging, ensuring flavor balance in your first brew.",
    iconSvg: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="24" cy="24" r="18"/><polyline points="24 12 24 24 32 28"/></svg>`
  },
  {
    number: "04",
    title: "Brew",
    tagline: "Clarity in the Extraction",
    description: "From whole bean resting to precise burr grind distribution, we publish brew parameters that yield clean, balanced sweetness in every morning cup.",
    iconSvg: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 12h26a6 6 0 0 1 6 6v2a6 6 0 0 1-6 6H8v-14z"/><path d="M8 26v10a4 4 0 0 0 4 4h16a4 4 0 0 0 4-4V26"/><line x1="4" y1="44" x2="38" y2="44"/></svg>`
  }
]);

/**
 * SAMPLE REVIEWS (PORTFOLIO CONCEPT)
 * Note: Clearly framed as illustrative reviews for a concept roastery project.
 */
const SAMPLE_REVIEWS = Object.freeze([
  {
    id: "rev-1",
    author: "Hannah P.",
    location: "Portland, OR",
    coffee: "Ethiopia Guji",
    size: "12 oz, Whole bean",
    rating: 5,
    text: "The jasmine floral aroma in the dry fragrance is gentle and clear. Brewed through a ceramic dripper at 93°C, the sweet blueberry notes come through without harsh acidity."
  },
  {
    id: "rev-2",
    author: "Marcus L.",
    location: "Seattle, WA",
    coffee: "Ember House Blend",
    size: "2 lb, Filter Grind",
    rating: 5,
    text: "We keep this on our morning subscription delivery every four weeks. Very consistent cup with toffee and hazelnut notes that pair nicely with splash of oat milk."
  },
  {
    id: "rev-3",
    author: "Priya S.",
    location: "San Francisco, CA",
    coffee: "Sunday Decaf",
    size: "12 oz, Espresso Grind",
    rating: 5,
    text: "Easily one of the sweetest decafs I have brewed as an afternoon flat white. Creamy cherry notes and zero residual chemical aftertaste from the mountain water process."
  }
]);

/**
 * ACCESSIBLE FREQUENTLY ASKED QUESTIONS (FAQS)
 * Short, non-absolute, realistic specialty coffee guidance.
 */
const FAQS = Object.freeze([
  {
    id: "faq-shipping",
    question: "How does roastery pickup and standard shipping work?",
    answer: `Local roastery pickup is available Wednesday–Sunday 8:00 AM–3:00 PM at 1820 Cedar Row, Suite 4 in Portland. For postal orders, standard shipping is $5.95, and orders over $40 qualify for complimentary delivery within the contiguous United States.`
  },
  {
    id: "faq-freshness",
    question: "When are coffee bags roasted and dispatched?",
    answer: "We roast in small batches several mornings each week. Orders are typically fulfilled within 24 to 48 hours of roasting, so your coffee arrives having completed its initial degassing period."
  },
  {
    id: "faq-grind",
    question: "Which grind setting should I choose for my brewer?",
    answer: "We offer Whole Bean for home burr grinders, Espresso (fine), Filter (medium for pour-over and drip machines), and French Press (coarse). We recommend whole bean for maximum flavor longevity."
  },
  {
    id: "faq-subscriptions",
    question: "Can I adjust, pause, or cancel my coffee subscription?",
    answer: "Yes. Every subscription enjoys 10% savings and flexible 2, 4, or 6-week schedules. You can change your coffee selection, pause deliveries, or cancel at any time from your account drawer."
  },
  {
    id: "faq-returns",
    question: "What is your return policy for roasted coffee?",
    answer: "Because roasted coffee is a perishable agricultural good, we do not accept returns on opened bags. However, if your order arrives damaged or incorrect, our team will resolve it promptly."
  },
  {
    id: "faq-wholesale",
    question: "Do you supply partner cafes, restaurants, and offices?",
    answer: "We partner with a limited roster of independent cafes and creative spaces throughout the Pacific Northwest. Inquiries can be submitted to hello@cinderandcedar.example."
  }
]);

/**
 * DYNAMIC STATS COMPUTATION
 * Computed strictly from PRODUCTS data so it always stays synchronized.
 */
function getRoasteryStats() {
  const totalCoffees = PRODUCTS.length;
  
  // Extract unique origins
  const uniqueOrigins = new Set(
    PRODUCTS.map(p => p.origin.split(",")[p.origin.split(",").length - 1].trim())
  );
  
  // Extract unique roast numbers
  const uniqueRoasts = new Set(PRODUCTS.map(p => p.roast));
  
  return {
    coffeesCount: totalCoffees,
    originsCount: uniqueOrigins.size,
    roastSpectrumCount: uniqueRoasts.size
  };
}

/**
 * PROCEDURAL COFFEE BAG SVG GENERATOR
 * Generates an architectural, crisp vector illustration of a specialty coffee bag.
 * Built strictly from constant product data—never uses user input.
 *
 * @param {Object} product - Product entry from PRODUCTS
 * @param {Object} [options] - Configuration overrides (e.g. width, height)
 * @returns {string} Safe inline SVG markup
 */
function generateBagSvg(product, options = {}) {
  const width = options.width || 240;
  const height = options.height || 320;
  const bagColor = product.bagColor || "#2A1A12";
  const accentColor = product.accentColor || "#F6F0E6";
  const roastLevel = typeof product.roast === "number" ? product.roast : 3;

  // Render 5 roast level indicator dots
  let roastDotsSvg = "";
  for (let i = 1; i <= 5; i++) {
    const cx = 80 + (i - 1) * 20;
    const isFilled = i <= roastLevel;
    roastDotsSvg += `<circle cx="${cx}" cy="246" r="4.5" fill="${isFilled ? bagColor : "transparent"}" stroke="${bagColor}" stroke-width="1.5" />`;
  }

  // Safe sanitized strings from constant product object
  const productName = product.name;
  const productCategory = product.category.toUpperCase();

  return `
    <svg class="coffee-bag-svg" width="${width}" height="${height}" viewBox="0 0 240 320" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Specialty coffee pouch for ${productName}">
      <defs>
        <!-- Soft lighting gradient for 3D packaging depth -->
        <linearGradient id="bag-shade-${product.id}" x1="20" y1="20" x2="220" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${bagColor}" stop-opacity="0.95"/>
          <stop offset="70%" stop-color="${bagColor}" stop-opacity="1"/>
          <stop offset="100%" stop-color="#140B07" stop-opacity="0.9"/>
        </linearGradient>
        <!-- Subtle paper texture overlay -->
        <linearGradient id="label-crease-${product.id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.05"/>
        </linearGradient>
      </defs>

      <!-- Main Gusseted Bag Silhouette -->
      <path d="M 44 48 L 196 48 L 212 92 L 208 304 C 208 308 204 312 200 312 L 40 312 C 36 312 32 308 32 304 L 28 92 Z" fill="url(#bag-shade-${product.id})" />

      <!-- Top Fold & Heat Seal Strip -->
      <path d="M 40 48 L 200 48 L 196 26 C 196 22 192 18 188 18 L 52 18 C 48 18 44 22 44 26 Z" fill="${bagColor}" opacity="0.85"/>
      <line x1="44" y1="36" x2="196" y2="36" stroke="${accentColor}" stroke-opacity="0.25" stroke-dasharray="3 3" stroke-width="1.5"/>

      <!-- Bag Gusset Side Shadow Accents -->
      <path d="M 28 92 L 48 100 L 48 306 L 32 304 Z" fill="#000000" opacity="0.18"/>
      <path d="M 212 92 L 192 100 L 192 306 L 208 304 Z" fill="#000000" opacity="0.22"/>

      <!-- Degassing Aroma Valve -->
      <circle cx="120" cy="74" r="7" fill="${bagColor}" stroke="${accentColor}" stroke-opacity="0.3" stroke-width="1.5"/>
      <circle cx="120" cy="74" r="2.5" fill="#140B07" opacity="0.6"/>

      <!-- Editorial Front Label Plaque -->
      <rect x="52" y="102" width="136" height="172" rx="8" fill="#F6F0E6" stroke="#EADFCC" stroke-width="1.5"/>
      <rect x="52" y="102" width="136" height="172" rx="8" fill="url(#label-crease-${product.id})"/>

      <!-- Micro Typography on Bag Label -->
      <text x="120" y="128" fill="#C2512A" font-family="'DM Sans', system-ui, sans-serif" font-size="8" font-weight="700" letter-spacing="1.5" text-anchor="middle">CINDER &amp; CEDAR</text>
      <line x1="72" y1="136" x2="168" y2="136" stroke="#2A1A12" stroke-opacity="0.15" stroke-width="1"/>

      <!-- Product Name (Wraps or Centers cleanly) -->
      <text x="120" y="158" fill="#2A1A12" font-family="'Fraunces', Georgia, serif" font-size="14" font-weight="600" text-anchor="middle">${productName.split(" ")[0]}</text>
      <text x="120" y="176" fill="#2A1A12" font-family="'Fraunces', Georgia, serif" font-size="13" font-style="italic" text-anchor="middle">${productName.split(" ").slice(1).join(" ")}</text>

      <!-- Category Pill -->
      <rect x="76" y="190" width="88" height="16" rx="8" fill="#EADFCC" fill-opacity="0.7"/>
      <text x="120" y="201" fill="#2A1A12" font-family="'DM Sans', system-ui, sans-serif" font-size="7.5" font-weight="600" letter-spacing="1" text-anchor="middle">${productCategory}</text>

      <!-- Roast Level Indicator Header & Dots -->
      <text x="120" y="234" fill="#2A1A12" opacity="0.6" font-family="'DM Sans', system-ui, sans-serif" font-size="7" font-weight="600" letter-spacing="1" text-anchor="middle">ROAST SPECTRUM</text>
      ${roastDotsSvg}

      <!-- Bottom Weight Note -->
      <text x="120" y="266" fill="#2A1A12" opacity="0.45" font-family="'DM Sans', system-ui, sans-serif" font-size="6.5" letter-spacing="0.5" text-anchor="middle">WHOLE BEAN &bull; PORTLAND, OR</text>
    </svg>
  `.trim();
}

// Make accessible to window for script.js & motion.js
if (typeof window !== "undefined") {
  window.BRAND = BRAND;
  window.PRODUCTS = PRODUCTS;
  window.GRIND_OPTIONS = GRIND_OPTIONS;
  window.TASTING_NOTES_ROW_1 = TASTING_NOTES_ROW_1;
  window.TASTING_NOTES_ROW_2 = TASTING_NOTES_ROW_2;
  window.FARM_TO_CUP_STEPS = FARM_TO_CUP_STEPS;
  window.SAMPLE_REVIEWS = SAMPLE_REVIEWS;
  window.FAQS = FAQS;
  window.formatMoney = formatMoney;
  window.getRoasteryStats = getRoasteryStats;
  window.generateBagSvg = generateBagSvg;
}
