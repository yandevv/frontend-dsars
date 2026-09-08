/**
 * Regras do link de confirmação de e-mail, do cadastro e da troca de endereço.
 */

/** Quanto tempo o link vale depois de enviado. */
export const CONFIRMATION_LINK_HOURS = 24

/**
 * Intervalo mínimo entre dois envios. O documento de requisitos fixa cinco
 * minutos para o reenvio de e-mail na troca de senha; é a única regra de
 * reenvio que ele traz, e vale aqui também — cada envio invalida o anterior, e
 * o intervalo evita vários links circulando na mesma caixa de entrada.
 */
export const CONFIRMATION_RESEND_SECONDS = 5 * 60
