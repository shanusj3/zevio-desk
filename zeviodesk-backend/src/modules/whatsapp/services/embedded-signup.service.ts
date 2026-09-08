import { prisma } from "../../../config/prisma.js";
import { encryptionUtils } from "../../../utils/encryption.js";
import { metaWhatsappClient } from "../meta/meta-whatsapp.client.js";

const META_API_VERSION = "v20.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export const embeddedSignupService = {
  /**
   * Exchanges authorization code for long-lived access token and registers WABA details.
   * Meta Embedded Signup flow:
   * 1. Tenant logs in through Embedded Signup popup
   * 2. Meta returns an access code
   * 3. Backend exchanges this code for access token, subscribes WABA webhooks, and registers phone.
   */
  exchangeCodeAndConnect: async (
    tenantId: string,
    code: string,
    developerAppId: string,
    developerAppSecret: string
  ) => {
    // 1. Exchange short-lived authorization code for user access token
    const tokenUrl = `${META_BASE_URL}/oauth/access_token?client_id=${developerAppId}&client_secret=${developerAppSecret}&code=${code}&redirect_uri=`;
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error?.message || "OAuth exchange failed with Meta");
    }

    const accessToken = tokenData.access_token;

    // 2. Discover WABA and phone details linked to this access token
    // Meta /debug_token or /me/accounts can be used to resolve portfolio details
    const debugUrl = `${META_BASE_URL}/me/accounts`;
    const accountsResponse = await fetch(debugUrl, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const accountsData = await accountsResponse.json();

    if (!accountsResponse.ok || !accountsData.data?.[0]) {
      throw new Error("Could not discover WABA accounts associated with this token");
    }

    // Resolve details from account response
    const businessPortfolioId = accountsData.data[0].id;
    const businessName = accountsData.data[0].name;

    // Discover first phone number ID linked to the WABA account
    const wabaId = accountsData.data[0].id; // Simplification: portfolio WABA
    const phoneUrl = `${META_BASE_URL}/${wabaId}/phone_numbers`;
    const phoneResponse = await fetch(phoneUrl, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const phoneData = await phoneResponse.json();

    if (!phoneResponse.ok || !phoneData.data?.[0]) {
      throw new Error("Could not discover phone number ID for this WABA account");
    }

    const phoneNumberId = phoneData.data[0].id;
    const displayPhoneNumber = phoneData.data[0].display_phone_number;

    // 3. Subscribe Meta Webhooks to this WABA account
    const subscribeUrl = `${META_BASE_URL}/${wabaId}/subscribed_apps`;
    await fetch(subscribeUrl, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    // 4. Encrypt and save to PostgreSQL
    const encryptedToken = encryptionUtils.encrypt(accessToken);

    const whatsappConfig = await prisma.tenantWhatsApp.upsert({
      where: { tenantId },
      update: {
        wabaId,
        phoneNumberId,
        displayPhoneNumber,
        businessName,
        businessPortfolioId,
        status: "CONNECTED",
        accessToken: encryptedToken,
        connectedAt: new Date(),
        disconnectedAt: null,
      },
      create: {
        tenantId,
        wabaId,
        phoneNumberId,
        displayPhoneNumber,
        businessName,
        businessPortfolioId,
        status: "CONNECTED",
        accessToken: encryptedToken,
        connectedAt: new Date(),
      },
    });

    return whatsappConfig;
  }
};
