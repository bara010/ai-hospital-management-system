package com.hospito.service;

public record ChannelDeliveryResult(
        boolean delivered,
        String providerMessageId,
        String failureReason
) {

    public static ChannelDeliveryResult delivered(String providerMessageId) {
        return new ChannelDeliveryResult(true, providerMessageId, null);
    }

    public static ChannelDeliveryResult failed(String reason) {
        return new ChannelDeliveryResult(false, null, reason);
    }
}
