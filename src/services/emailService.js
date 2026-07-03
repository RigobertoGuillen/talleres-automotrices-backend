const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      name: 'SIGTA - Sistema de Gestión Taller',
      email: process.env.EMAIL_FROM
    };
    sendSmtpEmail.to = [{ email: to }];

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email enviado:', response.messageId);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('Error enviando email:', error.response?.body || error.message);
    return { success: false, error: error.response?.body || error.message };
  }
};

module.exports = { sendEmail };