// Envoi réel des e-mails : le navigateur ne peut pas parler SMTP.
// Définissez VITE_MAIL_API (fichier .env) vers un endpoint de votre backend
// qui reçoit { to, sujet, corps } et envoie le message (Resend, Brevo, SendGrid, SMTP…).
// Sans cette variable, les e-mails restent simulés (onglet « E-mails » du professeur).
const API = import.meta.env.VITE_MAIL_API

export async function envoyerEmail(mail) {
  if (!API) return
  try {
    await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mail) })
  } catch (e) {
    console.warn('Envoi e-mail échoué', e)
  }
}
