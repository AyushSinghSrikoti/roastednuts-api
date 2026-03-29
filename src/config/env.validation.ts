import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),

    PORT: Joi.number().port().default(8080),

    KICKBOX_API_KEY: Joi.string().allow('').default(''),

    KICKBOX_API_BASE_URL: Joi.string()
        .uri()
        .default('https://api.kickbox.com/v2'),
});