import { expect, it, jest } from '@jest/globals'
import { mockEnergyData, mockLogin } from './mocks.js'

it('should fetch data', async () => {
  jest.unstable_mockModule('../src/http-client.js', () => ({
    httpRequest: jest.fn<(_: { url: string, body: string }) => Promise<string>>((_: { url: string, body: string }) => {
      if (_.body.includes('getAuthentificationFront'))
        return Promise.resolve(mockLogin)
      else
        return Promise.resolve(mockEnergyData)
    }),
  }))

  const { VeoliaClient } = await import('../src/veolia.js')

  const client = new VeoliaClient({
    mail: 'foo',
    password: 'bar',
    pdl: 'baz',
  })

  const data = await client.getEnergyData()
  expect(data).toEqual([{
    start: '2023-10-26T10:00:00.000Z',
    state: 200,
    sum: 34574,
  }, {
    start: '2023-10-27T10:00:00.000Z',
    state: 142,
    sum: 34716,
  }],
  )
})
