export enum SupportedFiatCurrencies {
  USD = 'USD',
  AED = 'AED',
  EUR = 'EUR',
}

export enum SupportedCryptoCurrencies {
  // TRON = 'TRX',
  TRC20 = 'TRC20',
  ETH = 'ETH',
  ERC20 = 'ERC20',
  USDT = 'USDT'
}


export type SupportedCurrencies = SupportedCryptoCurrencies | SupportedFiatCurrencies

export enum ResponseCodes {
  BadRequest = 400,
  UnAuthorised = 401,
  Forbidden = 403,
  NotFound = 404,
  RequestTimeOutError = 408,
  ValidationError = 422,

  Redirect = 300,

  ServerError = 500,
  GatewayTimeOut = 502,
  ServerDown = 503,

  Success = 200,
}

export enum SocialLoginTypes {
  Google = 'Google',
}

export enum ResourceAccessType {
  Read = 'r',
  Write = 'w',
  Update = 'u',
  Delete = 'd',
}

export enum ResourceAccessLevels {
  All = 'All',
  Group = 'Group',
  User = 'User',
  None = 'None',
}

export enum OTPType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  AUTHENTICATOR = 'AUTHENTICATOR',
}

export enum DeFaultRoles {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum ShopState {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  PENDING = 'PENDING',
}

export enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
  BUNDLE = 'bundle',
  SUBSCRIPTION = 'subscription',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  DELETED = 'DELETED',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum MediaType {
  VIDEO = 'video', // all video types (mp4, etc)
  AUDIO = 'audio', // all audio categories (mp3, etc)
  IMAGE = 'image', //all categories of images (jpeg, png, webp, svg, gif, etc)
  PDF = 'pdf', // for pdfs only
  DOCUMENT = 'document', // for word documents
  MODEL_3D = 'model_3D',
  OTHER = 'other', // for any other document type
}

export enum LoginType {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
}

export enum TOTPStatus {
  ENABLED = 'ENABLED',
  REQUIRES_VERIFICATION = 'REQUIRES_VERIFICATION',
}

export enum ResourceAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',
}

export enum RoleType {
  SUPER_ADMIN = 'SUPER ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum FeatureCategory {
  SAFETY = 'SAFETY',
  COMFORT = 'COMFORT',
  TECHNOLOGY = 'TECHNOLOGY',
  PERFORMANCE = 'PERFORMANCE',
  LUXURY = 'LUXURY',
  OTHER = 'OTHER',
}

export enum CarDocumentType {
  REGISTRATION = 'REGISTRATION',
  INSURANCE = 'INSURANCE',
  MAINTENANCE = 'MAINTENANCE',
  OWNERSHIP = 'OWNERSHIP',
  INSPECTION = 'INSPECTION',
  ACCIDENT = 'ACCIDENT',
  OTHER = 'OTHER',
}

export enum CarHistoryRecordType {
  MAINTENANCE = 'MAINTENANCE',
  RENTAL = 'RENTAL',
  SALE = 'SALE',
  OWNERSHIP_CHANGE = 'OWNERSHIP_CHANGE',
  ACCIDENT = 'ACCIDENT',
  INSPECTION = 'INSPECTION',
  LOCATION_CHANGE = 'LOCATION_CHANGE',
  MODIFICATION = 'MODIFICATION',
  DETAILS_UPDATED = 'DETAILS_UPDATED',
}

export enum CarCategory {
  LUXURY_SEDAN = 'LUXURY_SEDAN',
  SPORTS_CAR = 'SPORTS_CAR',
  SUV = 'SUV',
  CONVERTIBLE = 'CONVERTIBLE',
  EXOTIC = 'EXOTIC',
  ELECTRIC_LUXURY = 'ELECTRIC_LUXURY',
  VINTAGE = 'VINTAGE',
}

export enum FuelType {
  GASOLINE = 'GASOLINE',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  HYDROGEN = 'HYDROGEN',
  PLUG_IN_HYBRID = 'PLUG_IN_HYBRID',
}

export enum TransmissionType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  SEMI_AUTOMATIC = 'SEMI_AUTOMATIC',
  DUAL_CLUTCH = 'DUAL_CLUTCH',
  CVT = 'CVT',
}

export enum OwnershipType {
  COMPANY_OWNED = 'COMPANY_OWNED',
  FRACTIONAL = 'FRACTIONAL',
  PRIVATE = 'PRIVATE',
  CONSIGNMENT = 'CONSIGNMENT',
}

export enum CarStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  RESERVED = 'RESERVED',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  IN_TRANSIT = 'IN_TRANSIT',
  SOLD = 'SOLD',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export enum CarListingType {
  FOR_RENT = 'FOR_RENT',
  FOR_SALE = 'FOR_SALE',
}

export enum CarCondition {
  EXCELLENT = 'EXCELLENT',
  VERY_GOOD = 'VERY_GOOD',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  NEEDS_MAINTENANCE = 'NEEDS_MAINTENANCE',
}

export enum CarInspectionStatus {
  PASSED = 'PASSED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  EXEMPTED = 'EXEMPTED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PENDING_CAPTURE = 'PENDING_CAPTURE',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum CarPricingUnit {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum DriverType {
  GCC = 'GCC',
  TOURIST = 'TOURIST',
  RESIDENT = 'RESIDENT'
}

export enum ContractViolationType {
  TRAFFIC_FINE = "TRAFFIC FINE",
  LATE_RETURN = "LATE RETURN",
  SMOKING = "SMOKING",
  DIRTY_RETURN = "DIRTY RETURN",
  DESERT_DRIVING = "DESERT DRIVING",
  DAMAGE = "DAMAGE",
  FUEL_SHORTAGE = "FUEL SHORTAGE",
  SALIK_TOLL = "SALIK TOLL",
  BORDER_CROSSING = "BORDER CROSSING",
  MILEAGE_EXCEEDED = "MILEAGE EXCEEDED",
  OTHER = "OTHER",
}