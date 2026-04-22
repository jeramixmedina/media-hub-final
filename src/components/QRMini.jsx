import React, { useEffect, useState } from 'react'
import { Preferences } from '@capacitor/preferences'
import LocalServer from '../plugins/LocalServer'

export default function QRMini({ onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [url, setUrl]             = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)

  useEffect(() => {
    async function init() {
      try {
        // Use cached IP or start server
        const { value } = await Preferences.get({ key: 'serverInfo' })
        let info = value ? JSON.parse(value) : null

        if (!info || !info.ip || info.ip === '0.0.0.0') {
          info = await LocalServer.start()
          await Preferences.set({
            key: 'serverInfo',
            value: JSON.stringify(info),
          })
        }

        const remoteUrl = `http://${info.ip}:${info.port}/remote`
        setUrl(remoteUrl)

        const QRCode = (await import('qrcode')).default
        const dataUrl = await QRCode.toDataURL(remoteUrl, {
          width: 180,
          margin: 1,
          color: { dark: '#7c3aed', light: '#0a0a12' },
        })
        setQrDataUrl(dataUrl)
      } catch (e) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:200,
        background:'rgba(0,0,0,0.75)',
        display:'flex', alignItems:'flex-end',
        justifyContent:'flex-end', padding:'0 16px 80px' }}
      onPointerDown={onClose}
    >
      <div
        style={{ background:'#12121e', borderRadius:20, padding:14, width:216 }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:10 }}>
          <span style={{ color:'#a78bfa', fontSize:13, fontWeight:600 }}>
            Remote QR
          </span>
          <button
            onPointerDown={onClose}
            style={{ background:'none', border:'none', color:'#475569',
              fontSize:20, lineHeight:1, cursor:'pointer' }}
          >
            ×
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display:'flex', justifyContent:'center', padding:'20px 0' }}>
            <div style={{ width:24, height:24,
              border:'2px solid #7c3aed',
              borderTopColor:'transparent',
              borderRadius:'50%',
              animation:'qrspin 0.8s linear infinite' }} />
            <style>{`@keyframes qrspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* QR image */}
        {qrDataUrl && (
          <div style={{ background:'#0a0a12', borderRadius:12,
            padding:8, display:'flex', justifyContent:'center' }}>
            <img src={qrDataUrl} alt="Remote QR" style={{ width:180, height:180 }} />
          </div>
        )}

        {/* URL text */}
        {url && (
          <div style={{ marginTop:10, background:'#0a0a12',
            borderRadius:10, padding:'8px 10px' }}>
            <div style={{ color:'#475569', fontSize:10, marginBottom:2 }}>URL</div>
            <div style={{ color:'#a78bfa', fontFamily:'monospace',
              fontSize:11, wordBreak:'break-all' }}>
              {url}
            </div>
          </div>
        )}

        {error && (
          <div style={{ color:'#f59e0b', fontSize:12, textAlign:'center',
            padding:'8px 0' }}>
            Server not started. Open Remote tab first.
          </div>
        )}

        <div style={{ marginTop:8, color:'#475569', fontSize:11,
          textAlign:'center' }}>
          Scan with phone on same WiFi / hotspot
        </div>
      </div>
    </div>
  )
}