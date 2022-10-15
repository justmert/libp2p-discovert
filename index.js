import { createLibp2p } from 'libp2p'
import { WebRTCStar } from '@libp2p/webrtc-star'
import { Noise } from '@chainsafe/libp2p-noise'
import { Mplex } from '@libp2p/mplex'



document.addEventListener('DOMContentLoaded', async () => {
  const webRtcStar = new WebRTCStar()

  // Create our libp2p node
  const libp2p = await createLibp2p({
    addresses: {
      // Add the signaling server address, along with our PeerId to our multiaddrs list
      // libp2p will automatically attempt to dial to the signaling server so that it can
      // receive inbound connections from other peers
      listen: [
        '/dns4/pacific-shelf-40622.herokuapp.com/tcp/443/wss/p2p-webrtc-star/'
      ]
    },
    transports: [
      webRtcStar
    ],
    connectionEncryption: [new Noise()],
    streamMuxers: [new Mplex()],
    peerDiscovery: [
      webRtcStar.discovery
    ]
  })

  // UI elements
  const status = document.getElementById('status')
  const output = document.getElementById('output')

  output.textContent = ''

  function log (txt) {
    output.textContent += `${txt.trim()}\n`
  }

  // Listen for new peers
  libp2p.addEventListener('peer:discovery', (evt) => {
    const peer = evt.detail
    log(`Found peer ${peer.id.toString()}`)

    // dial them when we discover them
    libp2p.dial(evt.detail.id).catch(err => {
      log(`Could not dial ${evt.detail.id}`, err)
    })
  })

  // Listen for new connections to peers
  libp2p.connectionManager.addEventListener('peer:connect', (evt) => {
    const connection = evt.detail
    log(`Connected to ${connection.remotePeer.toString()}`)
  })

  // Listen for peers disconnecting
  libp2p.connectionManager.addEventListener('peer:disconnect', (evt) => {
    const connection = evt.detail
    log(`Disconnected from ${connection.remotePeer.toString()}`)
  })

  await libp2p.start()
  status.innerText = 'libp2p started!'
  log(`libp2p id is ${libp2p.peerId.toString()}`)

  // Export libp2p to the window so you can play with the API
  window.libp2p = libp2p
})
