// Ritual HTTP Precompile Integration
// Uses HTTP precompile (0x0801) for external API calls

import { PRECOMPILES, TEE_SERVICE_REGISTRY_ADDRESS, Capability, DEFAULT_TTL } from './ritual-config';

export const HTTP_METHOD = {
  GET: 1,
  POST: 2,
  PUT: 3,
  DELETE: 4,
  PATCH: 5,
  HEAD: 6,
  OPTIONS: 7,
} as const;

export interface HTTPCallRequest {
  url: string;
  method: keyof typeof HTTP_METHOD;
  headers?: Record<string, string>;
  body?: string;
  executorAddress: string;
  ttl?: bigint;
}

/**
 * Encode HTTP precompile request (13-field ABI)
 */
export function encodeHTTPRequest(request: HTTPCallRequest): `0x${string}` {
  const { encodeAbiParameters, parseAbiParameters } = require('viem');
  
  const {
    url,
    method,
    headers = {},
    body = '',
    executorAddress,
    ttl = DEFAULT_TTL.SHORT_RUNNING,
  } = request;

  // Convert headers to arrays
  const headerKeys = Object.keys(headers);
  const headerValues = Object.values(headers);

  const encoded = encodeAbiParameters(
    parseAbiParameters([
      'address,',      // executor
      'bytes[],',      // encryptedSecrets
      'uint256,',      // ttl
      'bytes[],',      // secretSignatures
      'bytes,',        // userPublicKey
      'uint8,',        // method
      'string,',       // url
      'string[],',     // headerKeys
      'string[],',     // headerValues
      'string,',       // body
      'uint256,',      // dkmsKeyIndex
      'uint8,',        // dkmsKeyFormat
      'string',        // jqFilter
    ].join('')),
    [
      executorAddress,
      [],                           // encryptedSecrets
      ttl,
      [],                           // secretSignatures
      '0x',                         // userPublicKey
      HTTP_METHOD[method],          // method
      url,
      headerKeys,
      headerValues,
      body,
      0n,                           // dkmsKeyIndex
      0,                            // dkmsKeyFormat
      '',                           // jqFilter (empty for now)
    ],
  );

  return encoded as `0x${string}`;
}

/**
 * Decode HTTP response from receipt
 */
export function decodeHTTPResponse(responseData: `0x${string}`): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const { decodeAbiParameters, parseAbiParameters } = require('viem');
  
  try {
    const decoded = decodeAbiParameters(
      parseAbiParameters('uint16, string[], string[], bytes'),
      responseData
    );

    const [statusCode, headerKeys, headerValues, bodyBytes] = decoded;
    
    // Reconstruct headers object
    const headers: Record<string, string> = {};
    headerKeys.forEach((key: string, index: number) => {
      headers[key] = headerValues[index];
    });

    // Decode body
    const body = new TextDecoder().decode(bodyBytes as Uint8Array);

    return {
      statusCode: Number(statusCode),
      headers,
      body,
    };
  } catch (error) {
    console.error('Failed to decode HTTP response:', error);
    throw error;
  }
}

/**
 * Helper: Create CoinGecko price fetch request
 */
export function createCoinGeckoPriceRequest(
  executorAddress: string,
  coinId: string = 'ethereum'
): HTTPCallRequest {
  return {
    url: `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    executorAddress,
    ttl: 100n,
  };
}

/**
 * Helper: Create weather API request
 */
export function createWeatherRequest(
  executorAddress: string,
  city: string,
  apiKey: string
): HTTPCallRequest {
  return {
    url: `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    executorAddress,
    ttl: 100n,
  };
}

/**
 * Helper: Create sports API request
 */
export function createSportsRequest(
  executorAddress: string,
  sport: string,
  apiKey: string
): HTTPCallRequest {
  return {
    url: `https://api.the-odds-api.com/v4/sports/${sport}/scores?apiKey=${apiKey}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    executorAddress,
    ttl: 100n,
  };
}

/**
 * Helper: Create random.org request
 */
export function createRandomNumberRequest(
  executorAddress: string,
  min: number = 1,
  max: number = 100
): HTTPCallRequest {
  return {
    url: `https://www.random.org/integers/?num=1&min=${min}&max=${max}&col=1&base=10&format=plain&rnd=new`,
    method: 'GET',
    executorAddress,
    ttl: 100n,
  };
}

/**
 * Parse JSON response body
 */
export function parseJSONResponse<T = any>(body: string): T {
  try {
    return JSON.parse(body);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    throw new Error('Invalid JSON response');
  }
}

/**
 * Extract price from CoinGecko response
 */
export function extractCoinGeckoPrice(body: string, coinId: string = 'ethereum'): number {
  const data = parseJSONResponse(body);
  return data[coinId]?.usd || 0;
}

/**
 * Extract temperature from weather response
 */
export function extractWeatherTemp(body: string): number {
  const data = parseJSONResponse(body);
  return data.main?.temp || 0;
}

/**
 * Extract random number from random.org response
 */
export function extractRandomNumber(body: string): number {
  return parseInt(body.trim(), 10);
}
