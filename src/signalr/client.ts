type HubMethodCallback = (message: unknown) => Promise<void>

type HubMethodCallbacks = {
    [name: string]: HubMethodCallback
}

type SignalrMessageEnvelope = {
    C: string
    M: SignalrMessage[]
}

type SignalrMessage = {
    H: string
    M: string
    A: unknown[]
}

export class SignalrClient {
    baseUrlHttps: string
    baseUrlWss: string
    subscribedHubs: Map<string, HubMethodCallbacks>
    tid: number
    connectionData?: string
    connectionToken?: string

    constructor(baseUrlHttps: string, baseUrlWss: string) {
        this.baseUrlHttps = baseUrlHttps
        this.baseUrlWss = baseUrlWss

        this.subscribedHubs = new Map()
        this.tid = SignalrClient.generateTid()
    }

    public subscribeHub(hubName: string, hubMethodCallbacks: HubMethodCallbacks) {
        this.subscribedHubs.set(hubName, hubMethodCallbacks)
    }

    public async start() {
        // Build connection data based on subscribed hubs
        const subscribedHubs = Array.from(this.subscribedHubs.keys())
        this.connectionData = encodeURIComponent(JSON.stringify(subscribedHubs.map(hub => ({name: hub}))))

        // Negotiate a token
        const url = `${this.baseUrlHttps}/signalr/negotiate?clientProtocol=2.1&connectionData=${this.connectionData}&tid=${this.tid}`
        const response = await fetch(url)
        const responseBody = await response.json()
        this.connectionToken = encodeURIComponent(responseBody.ConnectionToken)
        console.log(`Using token ${this.connectionToken}`)

        // Open a WebSocket
        const wssUrl = `${this.baseUrlWss}/signalr/connect?transport=webSockets&clientProtocol=2.1&connectionToken=${this.connectionToken}&connectionData=${this.connectionData}&tid=${this.tid}`
        const wss = new WebSocket(wssUrl)

        wss.addEventListener('open', async () => {
            // Signal that we have started
            const startUrl = `${this.baseUrlHttps}/signalr/start?transport=webSockets&clientProtocol=2.1&connectionToken=${this.connectionToken}&connectionData=${this.connectionData}&tid=${this.tid}`
            const response = await fetch(startUrl)
            const responseJson = await response.json()
            console.log(startUrl)
            console.dir(responseJson)
        })

        wss.addEventListener('message', async (event: MessageEvent) => {
            // Discard empty keepalive messages
            const rawMessage = event.data as string
            if (rawMessage === '{}') {
                return
            }

            const envelope = JSON.parse(rawMessage) as SignalrMessageEnvelope
            for (const message of envelope.M) {
                // Ignore if we're not subscribed to messages from this hub, for some reason
                const hubCallbacks = this.subscribedHubs.get(message.H)
                if (hubCallbacks === undefined) {
                    return
                }

                for (const actualMessage of message.A) {
                    // Call any configured callbacks for this message type
                    const onMessage = hubCallbacks[message.M]
                    if (onMessage !== undefined) {
                        await onMessage(actualMessage)
                    }
                }
            }
        })
    }

    private static generateTid(): number {
        return Math.floor(Math.random() * 11)
    }
}
