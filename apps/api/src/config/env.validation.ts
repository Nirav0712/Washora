export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(env: Record<string, any> = process.env): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  // 1. Port Validation
  const port = parseInt(env.PORT || '4000', 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    errors.push(`Invalid PORT configuration: "${env.PORT}". Port must be a number between 1 and 65535.`);
  }

  // 2. MongoDB URI Validation
  const mongoUri = env.MONGODB_URI;
  if (!mongoUri) {
    if (isProd) {
      errors.push('MONGODB_URI is required in production environment.');
    } else {
      warnings.push('MONGODB_URI is not set; falling back to default localhost connection.');
    }
  } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    errors.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://".');
  }

  // 3. JWT Secrets Validation
  const accessSecret = env.JWT_ACCESS_SECRET;
  const refreshSecret = env.JWT_REFRESH_SECRET;

  if (isProd) {
    if (!accessSecret) {
      errors.push('JWT_ACCESS_SECRET is required in production environment.');
    } else if (accessSecret.length < 32) {
      errors.push('JWT_ACCESS_SECRET must be at least 32 characters long in production.');
    }

    if (!refreshSecret) {
      errors.push('JWT_REFRESH_SECRET is required in production environment.');
    } else if (refreshSecret.length < 32) {
      errors.push('JWT_REFRESH_SECRET must be at least 32 characters long in production.');
    }

    if (accessSecret && refreshSecret && accessSecret === refreshSecret) {
      errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must not be identical.');
    }
  } else {
    if (!accessSecret) {
      warnings.push('JWT_ACCESS_SECRET is not defined; using default development secret.');
    }
    if (!refreshSecret) {
      warnings.push('JWT_REFRESH_SECRET is not defined; using default development secret.');
    }
  }

  // 4. CORS Origin Validation
  if (isProd && !env.CORS_ORIGIN) {
    warnings.push('CORS_ORIGIN is not set in production. It is recommended to specify allowed domains.');
  }

  // 5. Optional Integrations (Warnings only if partially configured)
  const cloudinaryCloud = env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryKey = env.CLOUDINARY_API_KEY;
  const cloudinarySecret = env.CLOUDINARY_API_SECRET;
  if ((cloudinaryCloud || cloudinaryKey || cloudinarySecret) && (!cloudinaryCloud || !cloudinaryKey || !cloudinarySecret)) {
    warnings.push('Cloudinary integration is partially configured. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are all set.');
  }

  const whatsappPhoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  const whatsappToken = env.WHATSAPP_ACCESS_TOKEN;
  if ((whatsappPhoneId || whatsappToken) && (!whatsappPhoneId || !whatsappToken)) {
    warnings.push('WhatsApp Cloud API is partially configured. Ensure WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are both set.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
