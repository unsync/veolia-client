import { getLogger } from '@unsync/nodejs-tools'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'
import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import { httpRequest } from './httpClient.js'
import type { VeoliaConfig } from './models/veoliaConfig.js'
import type { VeoliaDataPoint } from './models/veoliaDataPoint.js'

dayjs.extend(utc)
dayjs.extend(timezone)

type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>

export class VeoliaClient {
  private config: VeoliaConfig
  private url = 'https://www.service.eau.veolia.fr/icl-ws/iclWebService'
  private xmlBuilder = new XMLBuilder({ ignoreAttributes: false })
  private xmlParser = new XMLParser()
  private logger = getLogger({ service: 'VeoliaClient' })

  constructor(config: VeoliaConfig) {
    this.config = config
  }

  private async login(): Promise<{ passwordToken: string, aboId: string } | undefined> {
    try {
      const loginBody = this.getSoapMessage({
        action: 'getAuthentificationFront',
        actionParams: [
          { key: 'cptEmail', value: this.config.mail },
          { key: 'cptPwd', value: this.config.password },
        ],
      })

      this.logger.info('VeoliaClient > login')
      const responseBody = await httpRequest({ url: this.url, body: this.xmlBuilder.build(loginBody) })

      // parse response
      const jsonObj = this.xmlParser.parse(responseBody)
      const soapBody = this.getSoapResponse({ action: 'getAuthentificationFront', jsonObj })

      // save token
      return {
        passwordToken: soapBody.espaceClient.cptPwd,
        aboId: soapBody.listContrats.aboId,
      }
    } catch (e) {
      this.logger.error(`VeoliaClient > login > error`, e)
    }
    return undefined
  }

  public async getEnergyData(firstDay?: Dayjs): Promise<VeoliaDataPoint[]> {
    try {
      const loginData = await this.login()
      if (!loginData) {
        this.logger.error(`VeoliaClient > login failed`)
        return []
      }
      const body = this.getSoapMessage({
        action: 'getConsommationJournaliere',
        actionParams: [{ key: 'aboNum', value: loginData.aboId }],
        username: this.config.mail,
        passwordToken: loginData.passwordToken,
      })

      this.logger.info('VeoliaClient > fetch data')
      const responseBody = await httpRequest({ url: this.url, body: this.xmlBuilder.build(body) })

      // parse response
      const jsonObj = this.xmlParser.parse(responseBody)
      const soapBody: JSONValue[] = this.getSoapResponse({ action: 'getConsommationJournaliere', jsonObj })

      const dataPoints: VeoliaDataPoint[] = soapBody.map((r: any) => {
        return {
          codeRetour: r.codeRetour,
          consommation: r.consommation,
          dateReleve: r.dateReleve,
          fiabiliteIndex: r.fiabiliteIndex,
          index: r.index,
        }
      })

      return dataPoints.filter((r) => {
        return firstDay ? dayjs(r.dateReleve).isAfter(firstDay, 'day') : true
      })
    } catch (e) {
      this.logger.error(`VeoliaClient > getEnergyData > error: ${JSON.stringify(e)}`, e)
      return []
    }
  }

  private getSoapResponse(_: { action: string, jsonObj: JSONValue }) {
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    return _.jsonObj['root.message@cxf.apache.org']['soap:Envelope']['soap:Body'][`ns2:${_.action}Response`].return
  }

  private getSoapMessage(_: {
    action: string
    actionParams: { key: string, value: string }[]
    username?: string
    passwordToken?: string
  }) {
    const body: JSONValue = {}
    body[`ns2:${_.action}`] = {
      '@_xmlns:ns2': 'http://ws.icl.veolia.com/',
    }
    _.actionParams.forEach((param) => {
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      body[`ns2:${_.action}`][param.key] = param.value
    })

    return {
      'soap:Envelope': {
        'soap:Header': {
          'wsse:Security': {
            'wsse:UsernameToken': {
              'wsse:Username': _.username || 'anonyme',
              'wsse:Password': {
                '#text': _.passwordToken || 'PYg6fMplCoo19dZVXkn2',
                '@_Type':
                  'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText',
              },
              'wsse:Nonce': {
                '#text': '1dWl+HzD/sJsWzAcDHQX6Q==',
                '@_EncodingType':
                  'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary',
              },
              'wsse:Created': '2022-11-22T07:54:00.000Z',
              '@_xmlns:wsu': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
              '@_wsu:Id': 'UsernameToken-aiehdbsf52',
            },
            '@_xmlns:wsse': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
            '@_xmlns:wsu': 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
          },
        },
        'soap:Body': body,
        '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
        '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      },
    }
  }
}
