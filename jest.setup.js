require('reflect-metadata');

process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/test_nest_dashboard?schema=public';
process.env.REPORTING_DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/test_nest_reporting?schema=public';

/**
 * Uncomment this line to use the Rails API instead of the NestJS API.
 */
// process.env.USE_RAILS_API = 'true';

process.env.CLOUDINARY_URL =
  'cloudinary://api_key:api_secret@mediavine/mediavine-res.cloudinary.com?cname=images.mediavine.com&secure=true';
process.env.DEVISE_JWT_SECRET_KEY =
  'c9c6d5db1b67d286d80bea1eace18baaf66056ffe87de7dd8ce5115e54948edbb0e0a24a0fc1aadc7bb00ed704e6943f633ba78df5ce7f8ef6e5fc2cd306f2b6';
process.env.NODE_ENV = 'test';
process.env.FASTLY_SERVICE_ID = '';
process.env.FASTLY_API_KEY = '';
process.env.MAIL_HOST = 'reporting-staging.mediavine.com';
process.env.MANDRILL_PASSWORD = 'MANDRILL_PASSWORD';
process.env.SECRET_KEY_BASE =
  '0f39f39063f76dc1be8d56fd657dfd7f8f02b81355f4b40614c47ea85a2e6f77bc4c790b8a0e363a09eab06766ac7f4525dd2cd30eb733d4a238f5836eed01ac';
process.env.TIPALTI_HISTORY_URL = 'https://ui2.sandbox.tipalti.com';
process.env.TIPALTI_BASE_URL = 'https://ui.sandbox.tipalti.com';
process.env.TIPALTI_API_KEY =
  '7qDcfo46vSPaDkWC9Xj0Jv3rzfu7NLlvDkgT7QHjuiDf8fKW77Nzd9vSkw67grdW';
