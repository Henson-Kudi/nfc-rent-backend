type DateInputType = Date | string | number;

type NonEmptyArray<T> = [T, ...T[]];

type SupportedLocales = 'en' | 'fr' | 'es' | 'zh' | 'it' | 'ar' | 'ru';

type SupportedCryptoNetworks = 'tron' | 'ethereum';

type PaginationOptions = {
  page?: number;
  limit?: number;
};

type CalculatedPrice = {
  total: number; // add gas fee to the calculated price
  breakdown: {
    base: {
      amount: number;
      currency: SupportedCurrencies;
      breakdown: {
        amount: number;
        unit: string;
        duration: number;
        count: number;
      }[];
    };
    securityDeposit?: {
      amount: number;
      currency: SupportedCurrencies;
      breakdown: {
        amount: number;
        unit: string;
        duration: number;
        count: number;
      }[];
    };
    // When we integrate dynamic discounts and addons, we can add the properties here
  };
  currency: SupportedCurrencies;
};

type NumberFilter = {
  min?: number;
  max?: number;
};

type DateFilter = {
  start?: number | string | Date;
  end?: number | string | Date;
};

interface MediaItem {
  url: string;
  type: string; //Checkk MediaType enum
  isThumbnail: boolean; //defaults to false
}

interface IUseCase<Input extends unknown[], Output> {
  execute(...args: Input): Promise<Output>;
}

type JwtType = 'ACCESS_TOKEN' | 'REFRESH_TOKEN';

type ModuleNode = {
  name: string;
  path: string;
  children?: ModuleTree;
};

type ModuleTree = {
  [key: string]: ModuleNode;
};

interface MessageHandler {
  (message: string, channel: string): Promise<void> | void;
}

interface PublishedMessage<Data> {
  data: Data;
}

interface IMessageBroker {
  publishMessage<Data = unknown>(
    channel: string,

    message: PublishedMessage<Data>
  ): Promise<void>;
  subscribe(
    channel: string,

    callback: MessageHandler
  ): Promise<void>;
  disconnect(): Promise<void>;
  quit(): Promise<void>;
  connect(): Promise<void>;
  isPublisherConnected: boolean;
  isSubscriberConnected: boolean;
}

// Authentication modules
type OTPValidationData = {
  token?: string;
  deviceName: string;
  userId?: string;
  email?: string;
  location: string;
  code: string;
  type: string;
  [key: string]: unknown;
};

type RegisterUserData = {
  fullName: string;
  email: string;
  phone: string;
  photo?: string;
  password: string;
  confirmPassword: string;
  roles?: string[];
  [key: string]: unknown;
};

type LoginData = {
  email?: string;
  password?: string;
  loginType: string;
  idToken?: string; // google login token
  deviceName: string;
  location: string;
  [key: string]: unknown;
};

type LogoutData = {
  userId: string;
  deviceName: string;
  location: string;
  [key: string]: unknown;
};

type RequestOTPData = {
  email?: string;
  userId?: string;
  phone?: string;
  type: 'email' | 'phone';
};

type ChangePasswordData = {
  oldPassword?: string;
  newPassword: string;
  userId: string;
  confirmNewPassword: string;
};

// User module types
interface UpdateUserData {
  fullName?: string;
  photo?: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'production' | 'development';
    PORT: string | number;
    REDIS_URL: string;
    ACCESS_TOKEN_PRIVATE_KEY?: string;
    REFRESH_TOKEN_PRIVATE_KEY?: string;
    ACCESS_TOKEN_EXPIRES_IN?: string;
    REFRESH_TOKEN_EXPIRES_IN?: string;
    GOOGLE_AUTH_CLIENT_ID?: string;
    GOOGLE_AUTH_CLIENT_SECRET?: string;
    DEFAULT_EMAIL_SENDER?: string;
    EMAIL_AUTH_PASSWORD?: string;
    EMAIL_AUTH_USER?: string;
    DEFAULT_SMS_SENDER?: string;
    DEFAULT_WHATSAPP_SENDER?: string;
    CRYPTO_ENCRYPTION_KEY?: string;
    DATABASE_SERVER_URL?: string;
    DATABASE_URL?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    FRONTEND_URL?: string;
    EXCHANGE_RATES_DATA_API?: string;
    ETH_MNEMONIC?: string;
    ETH_RPC_URL?: string;
    ETH_USDT_CONTRACT_ADDRESS?: string;
    ETH_WS_URL?: string;
    ETH_BASE_PATH?: string;
    TRON_FULL_HOST?: string;
    TRON_FULL_HOST_API_KEY?: string;
    TRON_MNEMONIC?: string;
    TRON_MAIN_WALLET_ADDRESS?: string;
    TRON_USDT_CONTRACT_ADDRESS?: string;
    TRON_BASE_PATH?: string;
    TRON_PRIVATE_KEY?: string;
    BITPAY_API_KEY?: string;
    BITPAY_API_URL?: string;
    API_BASE_URL?: string;
    COINBASE_API_URL?: string;
    COINBASE_API_KEY?: string;
    COINBASE_WEBHOOK_KEY?: string;
    PDF_ADMIN_PASSWORD?: string;
    AWS_S3_BUCKET_NAME?: string;
    AWS_S3_REGION?: string;
    AWS_S3_ACCESS_KEY_ID?: string;
    AWS_S3_SECRET_ACCESS_KEY?: string;
    TWILIOTWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
  }
}

// Entities
interface ITranslationEntity<T> {
  id: string;
  locale: string;
  parent: T; // Generic parent reference (type only)
}

type CarPricingUnit = 'hour' | 'day' | 'week' | 'month' | 'year';

// DTOS
//Translation entity dto
interface TranslationEntityDTO {
  locale: SupportedLocales;
} // All translation entity dtos should extend this dto.

type SortOrder = 'ASC' | 'DESC';

type CarSortField =
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'isActive'
  | 'isDeleted'
  | 'deletedAt';

type CarFilterOptions = {
  locale?: SupportedLocales;
  limit: number;
  skip: number;
  sortBy?: CarSortField;
  sortOrder?: 'ASC' | 'DESC';
  withDocuments?: boolean;
  withOwnerDetails?: boolean;
  withHistory?: boolean;
  withAddons?: boolean;
};

type CarFilter = {
  id?: string[];
  slug?: string[];
  search?: string;
  vin?: string;
  year?: NumberFilter;
  category?: string[];
  fuelType?: string[];
  transmission?: string[];
  doors?: NumberFilter;
  seats?: NumberFilter;
  metaverseAssetId?: string;
  status?: string[];
  listingType?: CarListingType[];
  mileage?: NumberFilter;
  condition?: string[];
  inspectionStatus?: string[];
  lastInspectionDate?: DateFilter;
  nextInspectionDueDate?: DateFilter;
  model?: string[]; //list of car model ids
  features?: string[]; // list of car feature ids
  pricing?: NumberFilter & { unit: CarPricingUnit }; // unit is required for effective filter
  owner?: string[]; //List of user ids for owner
};

type GetCarsFilter = CarFilter & Partial<CarFilterOptions> & { page?: number };

interface CarMedia extends MediaItem {
  title?: string;
  description?: string;
  position: number; //index of the media item
}

interface RentalPricing {
  duration: number;
  unit: CarPricingUnit;
  price: number;
  currency: SupportedCurrencies; // Maybe we should have a enum of supported currencies and have validation to check if currency is valid fiat or crypto currency
  mileageLimit: number; // mileage limit in KM
}

interface CarDocument {
  type: string; //Check CarDocument enum
  title: string;
  fileUrl: string;
  issueDate: DateInputType;
  expiryDate?: DateInputType;
  isVerified: boolean;
  verificationDate?: DateInputType;
}

type CarDimension = {
  length: number;
  width: number;
  height: number;
  weight: number;
  cargoCapacity: number;
};

type CarEngineSpecs = {
  type: string;
  horsepower: number;
  torque: number;
  displacement?: number;
  batteryCapacity?: number;
  range?: number;
  acceleration: number;
  topSpeed: number;
  size: number;
};

type CarOwnerDetail = {
  ownerId: string;
  ownerType: 'User' | 'Company';
  percentage: number;
  nftId?: string;
  acquiredDate: DateInputType;
  transferDate?: DateInputType;
  status: 'Active' | 'Pending' | 'Transferred';
};

interface CreateCarDTO {
  vin: string;
  blockchainId?: string;
  year: number;
  category: string;
  fuelType: string;
  transmission: string;
  doors: number;
  seats: number;
  metaverseAssetId?: string;
  currentStatus: string;
  listingType: string[];
  acquisitionDate?: DateInputType;
  mileage: number;
  condition: string;
  inspectionStatus: string;
  lastInspectionDate?: DateInputType;
  nextInspectionDueDate?: DateInputType;
  engineSpecs: CarEngineSpecs;
  dimensions: CarDimension;
  media: CarMedia[];
  model: string; // car model id. from this we'll get the brand. No need to pass a brand id since model is related to brand as well.
  features?: string[]; // list of car feature ids
  rentalPricings?: RentalPricing[];
  documents?: CarDocument[];
  owner?: CarOwnerDetail;
  translations: NonEmptyArray<CarTranslationDTO>; // brand must have at least data in english since english is the default language
  securityDeposit: { currency: SupportedCurrencies; amount: number };
}

type CarColor = {
  name: string;
  code?: string;
};

interface CarTranslationDTO extends TranslationEntityDTO {
  name: string;
  color: CarColor;
  interiorColor: CarColor;
  shortDescription?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaTags?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UpdateCarDTO extends Partial<CreateCarDTO> {} // U can only update these 2. If u wan to update translations, use update translations api

interface UpdateCarTranslation extends TranslationEntityDTO {
  name?: string; // if name is being changed for english locale, make sure to change the code as well as the slug.
  shortDescription?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaTags?: string;
}

type BrandSortField =
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'isActive'
  | 'isDeleted'
  | 'deletedAt';

interface GetBrandsFilter {
  locale?: SupportedLocales;
  limit?: number | string;
  page?: number | string;
  sortBy?: BrandSortField;
  sortOrder?: SortOrder;
  id?: string[];
  slug?: string[];
  search?: string;
}
interface CreateBrandDTO {
  logo?: string;
  coverImage?: string;
  translations: NonEmptyArray<CarBrandTranslationDTO>; // brand must have at least data in english since english is the default language
}

interface CarBrandTranslationDTO extends TranslationEntityDTO {
  name: string;
  shortDescription?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaTags?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UpdateBrandDTO extends Partial<CreateBrandDTO> {}

interface UpdateBrandTranslation extends TranslationEntityDTO {
  name?: string; // if name is being changed for english locale, make sure to change the code as well as the slug.
  shortDescription?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaTags?: string;
}

type ModelSortField =
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'isActive'
  | 'isDeleted'
  | 'deletedAt';

interface GetModelsFilter {
  locale?: SupportedLocales;
  limit?: number | string;
  page?: number | string;
  sortBy?: ModelSortField;
  sortOrder?: SortOrder;
  id?: string[];
  slug?: string[];
  search?: string;
}
interface CreateModelDTO {
  brandId: string;
  translations: NonEmptyArray<CarModelTranslationDTO>; // Model must have at least data in english since english is the default language
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UpdateModelDTO extends Partial<CreateModelDTO> {}

interface CarModelTranslationDTO extends TranslationEntityDTO {
  name: string;
  shortDescription?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaTags?: string;
}

interface UpdateModelTranslation extends TranslationEntityDTO {
  name?: string; // if name is being changed for english locale, make sure to change the code as well as the slug.
  shortDescription?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaTags?: string;
}

interface CreateFeatureDTO {
  category: string;
  isHighlighted: boolean;
  translations: NonEmptyArray<CarFeatureTranslationDTO>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UpdateFeatureDTO extends Partial<CreateFeatureDTO> {}

interface GetFeaturesFilter {
  locale?: SupportedLocales;
  limit?: number | string;
  page?: number | string;
  sortBy?: BrandSortField;
  sortOrder?: SortOrder;
  id?: string[];
  slug?: string[];
  search?: string;
  category?: string[];
  isHighlighted?: 'true' | 'false';
}

interface CarFeatureTranslationDTO extends TranslationEntityDTO {
  name: string;
  shortDescription?: string;
  description?: string;
}

interface UpdateFeatureTranslation extends TranslationEntityDTO {
  name?: string; // if name is being changed for english locale, make sure to change the code as well as the slug.
  shortDescription?: string;
  description?: string;
}

type EnumTranslationManager = Record<SupportedLocales, Record<string, unknown>>;

// BOOKINGS
type GetBookingOptions = {
  locale?: SupportedLocales;
  page?: number;
  limit?: number;
  relations?:
    | {
        payment?: boolean | { addressMap: boolean };
        user?: boolean;
        driver?: boolean;
        car?: boolean;
        selectedAddons?: boolean;
      }
    | ['payment' | 'user' | 'driver' | 'car' | 'payment' | 'selectedAddons'];
};

type GetBookingsFilter = {
  number?: string[];
  user?: string[];
  driver?: string[];
  car?: string[];
  pickupDate?: DateFilter;
  returnDate?: DateFilter;
  totalAmount?: NumberFilter;
  status?: string[];
};

type GetBookingsQuery = GetBookingOptions & GetBookingsFilter;

type CarDamage = {
  policeReport: string; // url to pdf file of police report of damage
  images: string[]; // images of damage areas
  title: string; // Name of damage part
  description?: string; // Description of the damaged part (if any)
  position: {
    //Position of the damage on the 3D rendered car
    x: number;
    y: number;
    z?: number;
  };
};

type GetContractsFilter = {
  search?: string;
  user?: string[];
  driver?: string[];
  car?: string[];
  pickupDate?: DateFilter;
  returnDate?: DateFilter;
  totalAmount?: NumberFilter;
  status?: string[];
  createdAt?: DateFilter;
  signedAt?: DateFilter;
  booking?: string[];
  id?: string[];
  number?: string[];
};

type GetContractsOptions = {
  locale?: SupportedLocales;
} & PaginationOptions;

type GetContractsQuery = GetContractsOptions & GetContractsFilter;

type EmailAttachment = {
  filename?: string; //optional. if set, set with its file extension
  content: string | Buffer<ArrayBufferLike> | internal.Readable; // Required
  path: string; //path to file in fs
  contentType: string; //if not set, make sure to set filename so it can be infered from
};

type SendEmailNotification = {
  from?: string;
  to?: string;
  cc?: string[] | string;
  attachments?: EmailAttachment[];
  html?: string; //html string
  subject?: string; //optional email subject
  text?: string;
};

type SendPushNotificationBase = {
  data?: Record<string, string>;
  notification?: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  android?: {
    priority?: 'high' | 'normal';
  };
  webpush?: {
    headers?: Record<string, string>;
    data?: Record<string, string>;
    notification?: {
      title?: string;
      badge?: string;
      body?: string;
      data: Record<string, string>;
      dir?: 'auto' | 'ltr' | 'rtl';
      icon?: string;
      image?: string;
      lang?: string;
      renotify?: boolean;
      requireInteraction?: boolean;
      silent?: boolean;
      tag?: string;
      timestamp?: number;
      vibrate?: number | number[];
      [key: string]: unknown;
    };
    fcmOptions?: {
      link?: string;
    };
  };
  apns?: {
    headers: Record<string, string>;
    payload: {
      aps: {
        alert?: string | Record<string, string>;
        badge?: number;
        sound?:
          | string
          | {
              critical?: boolean;
              name: string;
              volume?: number;
            };
        contentAvailable?: boolean;
        [customData: string]: any;
      };
      [customData: string]: unknown;
    };
    fcmOptions?: {
      analyticsLabel?: string;
      imageUrl?: string;
    };
  };
};

type SendPushNotificationTopic = SendPushNotificationBase &
  {topic?: string};
type SendPushNotificationCondition = SendPushNotificationBase &
  {condition?: string};
type SendPushNotificationToken = SendPushNotificationBase &
  {token?: string};

type SendPushNotification =
  | SendPushNotificationCondition
  | SendPushNotificationToken
  | SendPushNotificationTopic;

type SendSMSNotification = {
  from?: string;
  to?: string;
  body?: string;
};
