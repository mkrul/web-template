import { subUnitDivisors } from '../config/settingsCurrency';
import {
  getSupportedProcessesInfo,
  isBookingProcessAlias,
} from '../transactions/transaction';

// Generic helpers for validating config values

const printErrorIfHostedAssetIsMissing = (props) => {
  Object.entries(props).map((entry) => {
    const [key, value = {}] = entry || [];
    if (Object.keys(value)?.length === 0) {
      console.error(`Mandatory hosted asset for ${key} is missing.
      Check that "appCdnAssets" property has valid paths in src/config/configDefault.js file,
      and that the marketplace has added content in Console`);
    }
  });
};

// Functions to create built-in specs for category setup.
const depthFirstSearch = (category, iterator, depth = 0) => {
  const { subcategories = [] } = category;
  return iterator(
    depth,
    subcategories.map((cat) => depthFirstSearch(cat, iterator, depth + 1))
  );
};
// Pick maximum depth from subcategories or default to given depth parameter
const getMaxDepth = (depth, subcategories) =>
  subcategories.length ? Math.max(...subcategories) : depth;
const createArray = (length) =>
  [...Array(length)].fill(null).map((_, i) => i + 1);

/**
 * Returns the fixed/built-in configs. Marketplace API has specified search schema for
 * categoryLevel1, categoryLevel2, categoryLevel3
 *
 * @param {Array} categories config from listing-categories.json asset
 * @returns object-literal containing fixed key and array of extended data keys used with nested categories.
 */
const getBuiltInCategorySpecs = (categories = []) => {
  // Don't change! The search schema is fixed to categoryLevel1, categoryLevel2, categoryLevel3
  const key = 'categoryLevel';
  const maxDepth = depthFirstSearch({ subcategories: categories }, getMaxDepth);
  const categoryLevelKeys = createArray(maxDepth).map((i) => `${key}${i}`);

  return { key, scope: 'public', categoryLevelKeys, categories };
};

/**
 * Check that listing fields don't have keys that clash with built-in keys
 * that this app uses in public data.
 *
 * @param {Object} listingFields object that has 'key' property.
 * @returns true if there's a clash with specific built-in keys.
 */
const hasClashWithBuiltInPublicDataKey = (listingFields) => {
  const builtInPublicDataKeys = [
    'listingType',
    'transactionProcessAlias',
    'unitType',
    'location',
    'pickupEnabled',
    'shippingEnabled',
    'shippingPriceInSubunitsOneItem',
    'shippingPriceInSubunitsAdditionalItems',
    'categoryLevel1',
    'categoryLevel2',
    'categoryLevel3',
  ];
  let hasClash = false;
  listingFields.forEach((field) => {
    if (builtInPublicDataKeys.includes(field.key)) {
      hasClash = true;
      console.error(
        `The id of a listing field ("${field.key}") clashes with the built-in keys that this app uses in public data.`
      );
    }
  });
  return hasClash;
};

/**
 * This ensures that accessControl config has private marketplace flag in place.
 *
 * @param {Object} accessControlConfig (returned by access-control.json)
 * @returns {Object} accessControl config
 */
const validAccessControl = (accessControlConfig) => {
  const accessControl = accessControlConfig || {};
  const marketplace = accessControl?.marketplace || {};
  return { ...accessControl, marketplace: { private: false, ...marketplace } };
};

/////////////////////////
// Merge localizations //
/////////////////////////

const mergeCurrency = (hostedCurrency, defaultCurrency) => {
  const currency = hostedCurrency || defaultCurrency;
  const supportedCurrencies = Object.keys(subUnitDivisors);
  if (supportedCurrencies.includes(currency)) {
    return currency;
  } else {
    console.error(
      `The given currency (${currency}) is not supported.
      There's a missing entry on subUnitDivisors`
    );
    return null;
  }
};

const validateStripeCurrency = (stripe) => {
  const supportedCountries = stripe.supportedCountries || [];
  const supportedCurrencies = Object.keys(subUnitDivisors);
  const validSupportedCountries = supportedCountries.filter((country) => {
    const isSupported = supportedCurrencies.includes(country.currency);

    if (!isSupported) {
      console.error(
        `Stripe configuration contained currency that was not supported by the client app.
        There's a missing entry on subUnitDivisors for ${country.currency}.`
      );
    }

    return isSupported;
  });
  return { ...stripe, supportedCountries: validSupportedCountries };
};

const mergeLocalizations = (hostedLocalization, defaultLocalization) => {
  // This defaults to 'en', if no locale is set.
  const locale =
    hostedLocalization?.locale || defaultLocalization.locale || 'en';
  // NOTE: We use this with DatePicker and moment, the range should be 0 - 6 instead of 1-7.
  const firstDay =
    hostedLocalization?.firstDayOfWeek ||
    defaultLocalization.firstDayOfWeek ||
    1;
  const firstDayInMomentRange = firstDay % 7;
  return { locale, firstDayOfWeek: firstDayInMomentRange };
};

/////////////////////
// Merge analytics //
/////////////////////

// The "arguments" (an Array like object) is only available for non-arrow functions.
function joinStrings(str1, str2) {
  const removeTrailingComma = (str) => str.trim().replace(/,\s*$/, '');
  // Filter out empty strings (falsy) and join remaining items with comma
  return Array.from(arguments)
    .filter(Boolean)
    .map((str) => removeTrailingComma(str))
    .join(',');
}

const mergeAnalyticsConfig = (
  hostedAnalyticsConfig,
  defaultAnalyticsConfig
) => {
  const { enabled, measurementId } =
    hostedAnalyticsConfig?.googleAnalytics || {};
  const googleAnalyticsId =
    enabled && measurementId
      ? measurementId
      : defaultAnalyticsConfig.googleAnalyticsId;

  // With Plausible, we merge hosted analytics and default (built-in) analytics if any (Plausible supports multiple domains)
  // Hosted format is: "plausible": { "enabled": true, "domain": "example.com" }
  const plausibleHostedConfig = hostedAnalyticsConfig?.plausible || {};
  const plausibleDomainsHosted =
    plausibleHostedConfig?.enabled && plausibleHostedConfig?.domain
      ? plausibleHostedConfig.domain
      : '';
  const plausibleDomainsDefault = defaultAnalyticsConfig.plausibleDomains;
  const plausibleDomains = joinStrings(
    plausibleDomainsHosted,
    plausibleDomainsDefault
  );
  const plausibleDomainsMaybe = plausibleDomains ? { plausibleDomains } : {};

  return { googleAnalyticsId, ...plausibleDomainsMaybe };
};

////////////////////
// Merge branding //
////////////////////

// Generate darker and lighter versions of marketplace color,
// if those values are not set by default.
// Adjusted from https://gist.github.com/xenozauros/f6e185c8de2a04cdfecf
const hexToCssHsl = (hexColor, lightnessDiff) => {
  let hex = hexColor.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h;
  let s;
  let l = (max + min) / 2;

  if (max == min) {
    // achromatic
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `hsl(${h}, ${s}%, ${l + lightnessDiff}%)`;
};

const getVariantURL = (socialSharingImage, variantName) => {
  return socialSharingImage?.type === 'imageAsset'
    ? socialSharingImage.attributes.variants[variantName]?.url
    : null;
};

const mergeBranding = (brandingConfig, defaultBranding) => {
  const {
    marketplaceColors,
    logo,
    logoSettings,
    loginBackgroundImage,
    socialSharingImage,
    ...rest
  } = brandingConfig || {};

  const marketplaceColor =
    marketplaceColors?.mainColor || defaultBranding.marketplaceColor;
  const marketplaceColorDark = marketplaceColor
    ? hexToCssHsl(marketplaceColor, -10)
    : null;
  const marketplaceColorLight = marketplaceColor
    ? hexToCssHsl(marketplaceColor, 10)
    : null;

  // The 'marketplaceColor' has a special status for branding. Other colors are just prefixed with "color".
  const colorPrimaryButton = marketplaceColors?.primaryButton;
  const colorPrimaryButtonDark = colorPrimaryButton
    ? hexToCssHsl(colorPrimaryButton, -10)
    : null;
  const colorPrimaryButtonLight = colorPrimaryButton
    ? hexToCssHsl(colorPrimaryButton, 10)
    : null;

  const logoSettingsRaw = logoSettings || defaultBranding.logoSettings;
  const validLogoSettings =
    logoSettingsRaw?.format === 'image' &&
    [24, 36, 48].includes(logoSettingsRaw?.height);

  const facebookImage =
    getVariantURL(socialSharingImage, 'scaled1200') ||
    defaultBranding.facebookImageURL;
  const twitterImage =
    getVariantURL(socialSharingImage, 'scaled600') ||
    defaultBranding.twitterImageURL;

  return {
    marketplaceColor,
    marketplaceColorDark,
    marketplaceColorLight,
    colorPrimaryButton,
    colorPrimaryButtonDark,
    colorPrimaryButtonLight,
    logoSettings: validLogoSettings
      ? logoSettingsRaw
      : { format: 'image', height: 24 },
    logoImageDesktop: logo || defaultBranding.logoImageDesktopURL,
    logoImageMobile: logo || defaultBranding.logoImageMobileURL,
    brandImage: loginBackgroundImage,
    facebookImage,
    twitterImage,
    ...rest,
  };
};

///////////////////
// Merge layouts //
///////////////////

const pickVariant = (hostedVariant, defaultVariant) =>
  hostedVariant?.variantType ? hostedVariant : defaultVariant;
const validVariantConfig = (
  hostedVariant,
  defaultVariant,
  validVariantTypes,
  fallback
) => {
  const variant = pickVariant(hostedVariant, defaultVariant);
  const isValidVariant = validVariantTypes.includes(variant?.variantType);

  if (!isValidVariant) {
    console.warn('Unsupported layout option detected', variant);
  }
  if (variant.variantType === 'cropImage') {
    const [w, h] = variant.aspectRatio.split('/') || ['1', '1'];
    const aspectWidth = Number.parseInt(w, 10);
    const aspectHeight = Number.parseInt(h, 10);
    return isValidVariant
      ? {
          ...variant,
          aspectWidth,
          aspectHeight,
          variantPrefix: defaultVariant.variantPrefix,
        }
      : fallback;
  }

  return isValidVariant ? variant : fallback;
};

const mergeLayouts = (layoutConfig, defaultLayout) => {
  const searchPage = validVariantConfig(
    layoutConfig?.searchPage,
    defaultLayout?.searchPage,
    ['map', 'grid'],
    { variantType: 'grid' }
  );

  const listingPage = validVariantConfig(
    layoutConfig?.listingPage,
    defaultLayout?.listingPage,
    ['coverPhoto', 'carousel'],
    { variantType: 'carousel' }
  );

  const listingImage = validVariantConfig(
    layoutConfig?.listingImage,
    defaultLayout?.listingImage,
    ['cropImage'],
    {
      variantType: 'cropImage',
      aspectWidth: 1,
      aspectHeight: 1,
      variantPrefix: 'listing-card',
    }
  );

  return {
    searchPage,
    listingPage,
    listingImage,
  };
};

////////////////////////////////////
// Validate and merge user configs //
////////////////////////////////////
const mergeUserConfig = (configAsset, defaultConfigs) => {
  const userTypes =
    configAsset.userTypes?.userTypes || defaultConfigs.user?.userTypes || [];
  const userFields =
    configAsset.userFields?.userFields || defaultConfigs.user?.userFields || [];

  return {
    userTypes,
    userFields,
  };
};

////////////////////////////////////
// Validate and merge listing configs //
////////////////////////////////////
const mergeListingConfig = (
  configAsset,
  defaultConfigs,
  validHostedCategories
) => {
  const listingTypes =
    configAsset.listingTypes?.listingTypes ||
    defaultConfigs.listing?.listingTypes ||
    [];
  const listingFields =
    configAsset.listingFields?.listingFields ||
    defaultConfigs.listing?.listingFields ||
    [];

  return {
    listingTypes,
    listingFields,
  };
};

////////////////////////////////////
// Validate and merge search configs //
////////////////////////////////////
const mergeSearchConfig = (
  hostedSearchConfig,
  defaultSearchConfig,
  categoryConfiguration,
  listingTypes
) => {
  // Use hosted search config if available, otherwise use default
  const searchConfig = hostedSearchConfig || defaultSearchConfig || {};

  // Build defaultFilters array from individual filter configs if not already present
  const defaultFilters =
    searchConfig.defaultFilters ||
    [
      // Add key property to dateRangeFilter
      defaultSearchConfig?.dateRangeFilter && {
        key: 'dates',
        ...defaultSearchConfig.dateRangeFilter,
      },
      // Add key property to priceFilter
      defaultSearchConfig?.priceFilter && {
        key: 'price',
        ...defaultSearchConfig.priceFilter,
      },
    ].filter(Boolean);

  return {
    ...defaultSearchConfig,
    ...searchConfig,
    defaultFilters,
  };
};

////////////////////////////////////
// Validate and merge map configs //
////////////////////////////////////
const mergeMapConfig = (hostedMapConfig, defaultMapConfig) => {
  const {
    mapProvider,
    mapboxAccessToken,
    openStreetMapConfig,
    ...restOfDefault
  } = defaultMapConfig;
  const mapProviderPicked = hostedMapConfig?.mapProvider || mapProvider;
  const mapboxAccessTokenPicked =
    hostedMapConfig?.mapboxAccessToken || mapboxAccessToken;

  const hasApiAccess =
    mapProviderPicked === 'openStreetMap' ? true : !!mapboxAccessTokenPicked;
  if (!hasApiAccess) {
    console.error(
      `The access tokens are not in place for the selected map provider (${mapProviderPicked})`
    );
  }

  return {
    ...restOfDefault,
    mapProvider: mapProviderPicked,
    mapboxAccessToken: mapboxAccessTokenPicked,
    openStreetMapConfig:
      hostedMapConfig?.openStreetMapConfig || openStreetMapConfig,
  };
};

////////////////////////////////////
// Validate and merge all configs //
////////////////////////////////////

// Check if all the mandatory info have been retrieved from hosted assets
const hasMandatoryConfigs = (hostedConfig) => {
  const { branding, listingTypes, listingFields, transactionSize } =
    hostedConfig;
  printErrorIfHostedAssetIsMissing({
    branding,
    listingTypes,
    listingFields,
    transactionSize,
  });
  return (
    branding?.logo &&
    listingTypes?.listingTypes?.length > 0 &&
    listingFields?.listingFields &&
    transactionSize?.listingMinimumPrice &&
    !hasClashWithBuiltInPublicDataKey(listingFields?.listingFields)
  );
};

export const mergeConfig = (configAsset = {}, defaultConfigs = {}) => {
  // Remove trailing slash from marketplaceRootURL if any
  const marketplaceRootURL = defaultConfigs.marketplaceRootURL;
  const cleanedRootURL =
    typeof marketplaceRootURL === 'string'
      ? marketplaceRootURL.replace(/\/$/, '')
      : '';

  // By default, always try to take the value of listingMinimumPriceSubUnits from the transaction-size.json asset.
  // - If there is no value, we use the defaultConfigs.listingMinimumPriceSubUnits
  // - If the value is 0 (aka _falsy_), we use the defaultConfigs.listingMinimumPriceSubUnits
  //   (The latter is mainly due to backward compatibility atm, since Console won't allow saving 0 anymore.)
  // Note: It might make sense that 0 handling is different for default-inquiry process.
  //       With the built-in code flow, you can only remove price altogether from listing type using default-inquiries.
  const listingMinimumPriceSubUnits =
    getListingMinimumPrice(configAsset.transactionSize) ||
    defaultConfigs.listingMinimumPriceSubUnits;

  const validHostedCategories = validateCategoryConfig(configAsset.categories);
  const categoryConfiguration = getBuiltInCategorySpecs(validHostedCategories);
  const listingConfiguration = mergeListingConfig(
    configAsset,
    defaultConfigs,
    validHostedCategories
  );

  return {
    // Use default configs as a starting point for app config.
    ...defaultConfigs,

    marketplaceRootURL: cleanedRootURL,

    // AccessControl config contains a flag whether the marketplace is private.
    accessControl: validAccessControl(configAsset.accessControl),

    // Overwrite default configs if hosted config is available
    listingMinimumPriceSubUnits,

    // Localization: currency is first-level config atm.
    currency: mergeCurrency(
      configAsset.localization?.currency,
      defaultConfigs.currency
    ),

    // Stripe config currently comes from defaultConfigs atm.
    stripe: validateStripeCurrency(defaultConfigs.stripe),

    // Localization (locale, first day of week)
    localization: mergeLocalizations(
      configAsset.localization,
      defaultConfigs.localization
    ),

    // Analytics might come from hosted assets at some point.
    analytics: mergeAnalyticsConfig(
      configAsset.analytics,
      defaultConfigs.analytics
    ),

    // Branding configuration comes entirely from hosted assets,
    // but defaults to values set in defaultConfigs.branding for
    // marketplace color, logo, brandImage and Facebook and Twitter images
    branding: mergeBranding(configAsset.branding, defaultConfigs.branding),

    // Layout configuration comes entirely from hosted assets,
    // but defaultConfigs is used if type of the hosted configs is unknown
    layout: mergeLayouts(configAsset.layout, defaultConfigs.layout),

    // User configuration comes entirely from hosted assets by default.
    user: mergeUserConfig(configAsset, defaultConfigs),

    // Set category configuration (includes fixed key, array of categories etc.
    categoryConfiguration,

    // Listing configuration comes entirely from hosted assets by default.
    listing: listingConfiguration,

    // Hosted search configuration does not yet contain sortConfig
    search: mergeSearchConfig(
      configAsset.search,
      defaultConfigs.search,
      categoryConfiguration,
      listingConfiguration.listingTypes
    ),

    // Map provider info might come from hosted assets. Other map configs come from defaultConfigs.
    maps: mergeMapConfig(configAsset.maps, defaultConfigs.maps),

    // Google Site Verification can be given through configs.
    // Renders a meta tag: <meta name="google-site-verification" content="[token-here]>" />
    googleSearchConsole: configAsset.googleSearchConsole?.googleSiteVerification
      ? configAsset.googleSearchConsole
      : defaultConfigs.googleSearchConsole,

    // The top-bar.json asset contains logo link and custom links
    // - The logo link can be used to link logo to another domain
    // - Custom links are links specified by marketplace operator (both internal and external)
    //   - Topbar tries to fit primary links to the visible space,
    //     but secondary links are always behind dropdown menu.
    topbar: configAsset.topbar, // defaultConfigs.topbar,

    // Include hosted footer config, if it exists
    // Note: if footer asset is not set, Footer is not rendered.
    footer: configAsset.footer,

    // Check if all the mandatory info have been retrieved from hosted assets
    hasMandatoryConfigurations: hasMandatoryConfigs(configAsset),
  };
};

///////////////////////////////
// Helper functions for listing configuration //
///////////////////////////////

/**
 * Validate categories configuration
 * @param {Array} categories - Array of category configurations
 * @returns {Array} - Valid categories or empty array
 */
export const validateCategoryConfig = (categories) => {
  if (!Array.isArray(categories)) {
    return [];
  }

  // Basic validation - ensure each category has required properties
  return categories.filter((category) => {
    if (!category || typeof category !== 'object') {
      return false;
    }

    // Category must have an id and name
    if (!category.id || !category.name) {
      console.warn(
        'Category configuration missing required id or name:',
        category
      );
      return false;
    }

    return true;
  });
};

/**
 * Extract the listing minimum price from transaction size configuration
 * @param {Object} transactionSizeConfig - The transaction size configuration
 * @returns {number|null} - The minimum price in sub-units or null if not found
 */
export const getListingMinimumPrice = (transactionSizeConfig) => {
  return transactionSizeConfig?.listingMinimumPrice?.amount || null;
};

/**
 * Check if the listing type configuration should display price
 * @param {Object} listingTypeConfig - The listing type configuration
 * @returns {boolean} - Whether to display price
 */
export const displayPrice = (listingTypeConfig) => {
  return listingTypeConfig?.defaultListingFields?.price !== false;
};

/**
 * Check if the listing type configuration should display location
 * @param {Object} listingTypeConfig - The listing type configuration
 * @returns {boolean} - Whether to display location
 */
export const displayLocation = (listingTypeConfig) => {
  return listingTypeConfig?.defaultListingFields?.location !== false;
};

/**
 * Check if the listing type configuration should display delivery pickup option
 * @param {Object} listingTypeConfig - The listing type configuration
 * @returns {boolean} - Whether to display delivery pickup
 */
export const displayDeliveryPickup = (listingTypeConfig) => {
  return listingTypeConfig?.defaultListingFields?.deliveryPickup !== false;
};

/**
 * Check if the listing type configuration should display delivery shipping option
 * @param {Object} listingTypeConfig - The listing type configuration
 * @returns {boolean} - Whether to display delivery shipping
 */
export const displayDeliveryShipping = (listingTypeConfig) => {
  return listingTypeConfig?.defaultListingFields?.deliveryShipping !== false;
};

/**
 * Check if payout details are required for the listing type
 * @param {Object} listingTypeConfig - The listing type configuration
 * @returns {boolean} - Whether payout details are required
 */
export const requirePayoutDetails = (listingTypeConfig) => {
  return listingTypeConfig?.requirePayoutDetails !== false;
};

/**
 * Check if price variations are enabled for a listing
 * @param {Object} publicData - The listing's public data
 * @param {Object} listingTypeConfig - The listing type configuration
 * @returns {boolean} - Whether price variations are enabled
 */
export const isPriceVariationsEnabled = (publicData, listingTypeConfig) => {
  // Check if price variations are enabled in public data first
  if (publicData?.priceVariationsEnabled !== undefined) {
    return publicData.priceVariationsEnabled;
  }

  // Fallback to listing type configuration
  return listingTypeConfig?.enablePriceVariations === true;
};
