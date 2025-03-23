import Joi from "joi";

const SendEmailNotificationPayload = Joi.object<SendEmailNotification>({
    attachments: Joi.array().items(Joi.object<EmailAttachment>({
        content: Joi.string().optional(),
        contentType: Joi.string().optional(),
        filename: Joi.string().required(),
        path: Joi.string().optional()
    }).xor('content', 'path')).optional(),
    cc: Joi.string().optional(),
    from: Joi.string().email().optional().allow('').allow(null),
    html: Joi.string().optional().allow(''),
    subject: Joi.string().optional(),
    text: Joi.string().optional(),
    to: Joi.string().email().required()
})

const SendPushNotificationPayload = Joi.object<SendPushNotification>({
    android: Joi.object<SendPushNotification['android']>({
        priority: Joi.string().valid('high', 'normal')
    }).optional(),
    apns: Joi.object<SendPushNotification['apns']>({
        fcmOptions: Joi.object({
            analyticsLabel: Joi.string().optional(),
            imageUrl: Joi.string().optional(),
        }).optional(),
        headers: Joi.object().unknown().optional(),
        payload: Joi.object().optional()
    }).unknown().optional(),
    condition: Joi.string().optional(),
    data: Joi.object().unknown(),
    notification: Joi.object<SendPushNotification['notification']>({
        body: Joi.string().optional(),
        imageUrl: Joi?.string().optional(),
        title: Joi.string().optional()
    }).or('title', 'body'),
    token: Joi.string().optional(),
    topic: Joi.string().optional(),
    webpush: Joi.object().unknown()
}).xor('token', 'topic', 'condition')

const SendSMSNotificationPayload = Joi.object<SendSMSNotification>({
    body: Joi.string().required(),
    from: Joi.string().optional(),
    to: Joi.string().required()
})


export function validateEmailNotification(payload: unknown) {
    return SendEmailNotificationPayload.validateAsync(payload, { abortEarly: false })
}
export function validatePushNotification(payload: unknown) {
    return SendPushNotificationPayload.validateAsync(payload, { abortEarly: false })
}
export function validateSMSNotification(payload: unknown) {
    return SendSMSNotificationPayload.validateAsync(payload, { abortEarly: false })
}