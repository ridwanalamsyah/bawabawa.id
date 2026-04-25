type MessagePayload = {
  to: string;
  templateCode: string;
  variables: Record<string, string>;
};

export class WhatsAppService {
  async sendMessage(payload: MessagePayload) {
    // Adapter point for official provider SDK.
    return {
      providerMessageId: `provider_${Date.now()}`,
      status: "success",
      payload
    };
  }
}
