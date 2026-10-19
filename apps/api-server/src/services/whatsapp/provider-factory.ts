import { WhatsAppProvider } from "./types";
import { MockWhatsAppProvider } from "./mock-provider";
import { CloudApiWhatsAppProvider } from "./cloud-api-provider";
import { config } from "../../config/env";
import { logger } from "../../lib/logger";

let activeProviderInstance: WhatsAppProvider | null = null;

/**
 * Returns the configured WhatsApp provider.
 * Default is strictly MockWhatsAppProvider unless WHATSAPP_PROVIDER=cloud_api is explicitly specified.
 * Never silently switches between mock and live sending.
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  if (activeProviderInstance) {
    return activeProviderInstance;
  }

  const requested = config.whatsappProvider;

  if (requested === "cloud_api") {
    logger.info("[WhatsAppFactory] Selected Meta WhatsApp Cloud API Provider");
    activeProviderInstance = new CloudApiWhatsAppProvider();
    return activeProviderInstance;
  }

  // Default: Mock Provider
  logger.info("[WhatsAppFactory] Selected MockWhatsAppProvider (Simulation Mode)");
  activeProviderInstance = new MockWhatsAppProvider();
  return activeProviderInstance;
}

/**
 * Sets a custom or stub provider (primarily for unit/integration testing).
 */
export function setWhatsAppProvider(provider: WhatsAppProvider | null): void {
  activeProviderInstance = provider;
}

/**
 * Clears cached provider instance (useful when reloading configuration).
 */
export function resetWhatsAppProvider(): void {
  activeProviderInstance = null;
}
