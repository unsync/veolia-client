export async function httpRequest(_: { url: string, body: string }): Promise<string> {
  const response = await fetch(_.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
    },
    body: _.body,
  })
  return response.text()
}
