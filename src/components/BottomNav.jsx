import React from 'react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function Icon({ name }) {
  const icons = {
    songbook: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    ),
    play: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <circle cx="12" cy="12" r="10"/>
        <polygon fill="currentColor" stroke="none" points="10 8 16 12 10 16 10 8"/>
      </svg>
    ),
    queue: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="8" y1="6" x2="21" y2="6"/>
        <line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    favorites: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    remote: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01"/>
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
  }
  return icons[name] || null
}

const tabs = [
  { path: '/songbook',   icon: 'songbook',  label: 'Songbook' },
  { path: '/nowplaying', icon: 'play',      label: 'Playing', center: true },
  { path: '/queue',      icon: 'queue',     label: 'Up Next' },
  { path: '/favorites',  icon: 'favorites', label: 'Favorites' },
  { path: '/remote',     icon: 'remote',    label: 'Remote' },
]

export default function BottomNav({ hasNowPlaying, hidden = false }) {
  const { queue } = useApp()

  return (
    <nav
      className={`flex items-stretch bg-surface border-t border-white/5 shrink-0 transition-all duration-300
        ${hidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      style={{ height: 56 }}
    >
      {tabs.map(tab => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 no-select touchable relative
             ${tab.center
               ? isActive ? 'text-accent-light' : hasNowPlaying ? 'text-accent' : 'text-muted'
               : isActive ? 'text-accent-light' : 'text-muted'
             }`
          }
        >
          {tab.path === '/queue' && queue.length > 0 && (
            <span className="absolute top-2 right-[calc(50%-16px)] bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
              {queue.length > 99 ? '99+' : queue.length}
            </span>
          )}
          {tab.center && hasNowPlaying && (
            <span className="absolute top-2 right-[calc(50%-12px)] w-2 h-2 rounded-full bg-success pulse-ring" />
          )}
          <Icon name={tab.icon} />
          <span className="text-[11px] leading-none">{tab.label}</span>
        </NavLink>
      ))}

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-0.5 px-3 no-select touchable
           ${isActive ? 'text-accent-light' : 'text-muted'}`
        }
      >
        <Icon name="settings" />
        <span className="text-[11px] leading-none">Settings</span>
      </NavLink>
    </nav>
  )
}
