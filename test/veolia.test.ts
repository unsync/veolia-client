import { expect, it, jest } from '@jest/globals'
import dayjs from 'dayjs'
import { mockEnergyData, mockLogin } from './mocks.js'

it('should fetch data', async () => {
  jest.unstable_mockModule('../src/httpClient.js', () => ({
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

  const dataFiltered = await client.getEnergyData(dayjs('2023-10-23'))
  expect(dataFiltered).toEqual([
    {
      codeRetour: 0,
      consommation: 200,
      dateReleve: '2023-10-26T00:00:00+02:00',
      fiabiliteIndex: 'M',
      index: 34374,
    },
    {
      codeRetour: 0,
      consommation: 142,
      dateReleve: '2023-10-29T00:00:00+02:00',
      fiabiliteIndex: 'M',
      index: 34574,
    },
  ],
  )

  const dataUnFiltered = await client.getEnergyData()
  expect(dataUnFiltered).toEqual([
    {
      codeRetour: 0,
      consommation: 200,
      dateReleve: '2023-10-23T00:00:00+02:00',
      fiabiliteIndex: 'M',
      index: 34374,
    },
    {
      codeRetour: 0,
      consommation: 200,
      dateReleve: '2023-10-26T00:00:00+02:00',
      fiabiliteIndex: 'M',
      index: 34374,
    },
    {
      codeRetour: 0,
      consommation: 142,
      dateReleve: '2023-10-29T00:00:00+02:00',
      fiabiliteIndex: 'M',
      index: 34574,
    },
  ],
  )
})
