// Link previews (WhatsApp, Facebook, Telegram...) never run the React app, so only those
// robots are sent to the API, which answers with the product's title, text and photo.
// Visitors and search engines keep getting the normal site.
const PREVIEW_BOTS = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|Slackbot|LinkedInBot|Discordbot|Pinterestbot|SkypeUriPreview/i

export default (request) => {
  if (!PREVIEW_BOTS.test(request.headers.get('user-agent') ?? '')) return
  const url = new URL(request.url)
  return new URL(`/.netlify/functions/api${url.pathname}`, url)
}

export const config = { path: '/produto/*' }
