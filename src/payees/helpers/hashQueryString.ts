import { createHmac } from 'crypto';

interface HashQueryStringParams {
  queryString: string;
  key: string;
}
/**
 * https://support.tipalti.com/Content/Topics/Development/iFrames/IframeAuthentication.htm#EncryptQueryStrings
 */
export function hashQueryString({ queryString, key }: HashQueryStringParams) {
  const hash = createHmac('sha256', key);
  hash.update(queryString);
  return hash.digest('hex');
}
