import { registerPlugin } from '@capacitor/core'

const LocalServer = registerPlugin('LocalServer', {
  web: () => ({
    start:      async () => ({ ip: '127.0.0.1', port: 8888 }),
    stop:       async () => {},
    getIp:      async () => ({ ip: '127.0.0.1' }),
    popCommand: async () => ({}),
  }),
})

export default LocalServer
