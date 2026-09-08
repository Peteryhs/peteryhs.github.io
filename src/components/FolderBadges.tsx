import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'

interface FolderItem {
  id: string
  title: string
  label: string
  icon?: string
  isMinecraft?: boolean
  items: {
    id: string
    title: string
    src: string
    targetX: number
    targetY: number
    rotation: number
    isTransparent?: boolean
    aspect?: 'portrait' | 'landscape' | 'contain'
  }[]
}

const FOLDERS_DATA: FolderItem[] = [
  {
    id: 'photos',
    title: 'Photos',
    label: 'Photos',
    items: [
      {
        id: 'p1',
        title: 'The Bund Waterfront',
        src: '/photos-bund.jpg',
        targetX: -160,
        targetY: -55,
        rotation: -7,
      },
      {
        id: 'p2',
        title: 'Forbidden City Overlook',
        src: '/photos-palace.jpg',
        targetX: -260,
        targetY: 45,
        rotation: 5,
      },
      {
        id: 'p3',
        title: 'Urban Dawn & Mountains',
        src: '/photos-cityscape.png',
        targetX: -80,
        targetY: 95,
        rotation: -4,
      },
    ],
  },
  {
    id: 'minecraft',
    title: 'Minecraft Launcher',
    label: 'Minecraft\nLauncher',
    isMinecraft: true,
    items: [
      {
        id: 'mc1',
        title: 'Hypixel Bedwars',
        src: '/minecraft-hypixel.png',
        targetX: -160,
        targetY: -65,
        rotation: -6,
      },
      {
        id: 'mc2',
        title: 'Prominence II',
        src: '/minecraft-prominence.png',
        targetX: -260,
        targetY: 30,
        rotation: 5,
      },
      {
        id: 'mc3',
        title: 'Peterfat11 Skin',
        src: '/minecraft-skin.png',
        targetX: -80,
        targetY: 85,
        rotation: -2,
      },
    ],
  },
  {
    id: 'gefa-2024',
    title: 'GEFA 2024',
    label: 'GEFA 2024',
    items: [
      {
        id: 'g1',
        title: 'GEFA Information Brochure',
        src: '/gefa-brochure.png',
        targetX: -160,
        targetY: -65,
        rotation: -6,
        aspect: 'portrait',
      },
      {
        id: 'g2',
        title: 'GEFA Business Plan',
        src: '/gefa-business-plan.png',
        targetX: -260,
        targetY: 30,
        rotation: 5,
        aspect: 'portrait',
      },
      {
        id: 'g3',
        title: 'GEFA Official Logo',
        src: '/gefa-logo.png',
        targetX: -80,
        targetY: 85,
        rotation: -2,
        isTransparent: true,
      },
    ],
  },
]

// Minecraft Logo SVG
function MinecraftBlockIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`folder-minecraft-logo ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* 3D Isometric Grass Cube */}
      <polygon points="16,3 29,9.5 16,16 3,9.5" fill="#5c8e32" stroke="currentColor" strokeWidth="1.2" />
      <polygon points="16,4.5 26,9.5 16,14.5 6,9.5" fill="#74b33c" opacity="0.6" />
      
      {/* Left Face */}
      <polygon points="3,9.5 16,16 16,29 3,22.5" fill="#866043" stroke="currentColor" strokeWidth="1.2" />
      <polygon points="3,9.5 16,16 16,19 3,12.5" fill="#4d7428" />
      <rect x="6" y="16" width="3" height="3" fill="#573d26" />
      <rect x="11" y="21" width="3" height="3" fill="#573d26" />

      {/* Right Face */}
      <polygon points="16,16 29,9.5 29,22.5 16,29" fill="#6d4e36" stroke="currentColor" strokeWidth="1.2" />
      <polygon points="16,16 29,9.5 29,12.5 16,19" fill="#3d5c20" />
      <rect x="20" y="22" width="3" height="3" fill="#48321e" />
      <rect x="24" y="15" width="3" height="3" fill="#48321e" />
    </svg>
  )
}

// Clean Minimal Folder Outline Icon
function FolderOutlineIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`folder-badge-svg ${className}`}
      viewBox="0 0 52 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 4 8 C 4 5.8 5.8 4 8 4 L 18 4 C 20.5 4 22.5 5.5 24 7.5 L 26 10 L 44 10 C 46.2 10 48 11.8 48 14 L 48 30 C 48 32.2 46.2 34 44 34 L 8 34 C 5.8 34 4 32.2 4 30 Z" />
    </svg>
  )
}

// Single Folder Badge Component
function SingleFolderBadge({
  folder,
  isOpen,
  onToggle,
}: {
  folder: FolderItem
  isOpen: boolean
  onToggle: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [screenSize, setScreenSize] = useState<'mobile' | 'desktop' | 'large'>('desktop')
  const btnRef = useRef<HTMLButtonElement>(null)
  const [btnPos, setBtnPos] = useState<{ x: number; y: number } | null>(null)
  const hasItems = folder.items && folder.items.length > 0

  const updatePos = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setBtnPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height * 0.38,
      })
    }
  }

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (w < 768) {
        setScreenSize('mobile')
      } else if (w >= 1440) {
        setScreenSize('large')
      } else {
        setScreenSize('desktop')
      }
      updatePos()
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isOpen) {
      updatePos()
      window.addEventListener('resize', updatePos)
      window.addEventListener('scroll', updatePos, { passive: true })
      return () => {
        window.removeEventListener('resize', updatePos)
        window.removeEventListener('scroll', updatePos)
      }
    }
  }, [isOpen])

  // Robust Global Click/Touch Outside Listener
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      // Don't dismiss if interacting with a photo card or folder button
      if (target.closest('.folder-freely-draggable-photo')) return
      if (target.closest('.folder-badge-btn')) return
      if (target.closest('.folder-empty-floating-notice')) return

      onToggle()
    }

    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    }, 40)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen, onToggle])

  const getItemTarget = (item: (typeof folder.items)[0], index: number) => {
    if (screenSize === 'mobile') {
      const mobileOffsets = [
        { x: -70, y: 95, rot: -6 },
        { x: 70, y: 105, rot: 5 },
        { x: 0, y: 195, rot: -2 },
      ]
      const m = mobileOffsets[index] || { x: 0, y: 110, rot: 0 }
      return { x: m.x, y: m.y, rotate: m.rot }
    }
    if (screenSize === 'large') {
      // Proportional scale up for large / wide viewports (spread out gracefully)
      return {
        x: Math.round(item.targetX * 1.55),
        y: Math.round(item.targetY * 1.35),
        rotate: item.rotation,
      }
    }
    return { x: item.targetX, y: item.targetY, rotate: item.rotation }
  }

  return (
    <div
      className={`folder-badge-item folder-badge-${folder.id} ${isOpen ? 'is-open' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Folder Trigger Button */}
      <button
        ref={btnRef}
        type="button"
        className="folder-badge-btn"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          updatePos()
          onToggle()
        }}
        aria-expanded={isOpen}
      >
        {/* Peek Previews on Hover */}
        {hasItems && (
          <div className="folder-peek-container" aria-hidden="true">
            {folder.items.slice(0, 3).map((item, index) => {
              const offsets = [
                { x: -14, y: -16, rot: -12 },
                { x: 0, y: -24, rot: 0 },
                { x: 14, y: -16, rot: 12 },
              ]
              const offset = offsets[index] || offsets[0]

              return (
                <motion.div
                  key={item.id}
                  className={`folder-peek-card ${item.isTransparent || folder.isMinecraft ? 'is-transparent-peek' : ''}`}
                  initial={false}
                  animate={
                    isHovered && !isOpen
                      ? {
                          x: offset.x,
                          y: offset.y,
                          rotate: offset.rot,
                          opacity: 1,
                          scale: 1,
                          filter: 'blur(0px)',
                        }
                      : {
                          x: 0,
                          y: 0,
                          rotate: 0,
                          opacity: 0,
                          scale: 0.5,
                          filter: 'blur(4px)',
                        }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 320,
                    damping: 22,
                  }}
                >
                  <img src={item.src} alt="" className="folder-peek-img" />
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Borderless Folder Icon / Minecraft Logo */}
        <div className="folder-badge-frame">
          {folder.isMinecraft ? (
            <MinecraftBlockIcon />
          ) : (
            <FolderOutlineIcon />
          )}
        </div>

        {/* Folder Title Label */}
        <span className="folder-badge-title">{folder.label}</span>
      </button>

      {/* Freely Floating Page Photos in root body Portal for Absolute Top Z-Index */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && btnPos && (
              <div
                className="folder-floating-photos-stage"
                style={{
                  position: 'fixed',
                  left: `${btnPos.x}px`,
                  top: `${btnPos.y}px`,
                  zIndex: 9999999,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {hasItems ? (
                  folder.items.map((item, index) => {
                    const target = getItemTarget(item, index)
                    return (
                      <motion.div
                        key={item.id}
                        className="folder-freely-draggable-photo"
                        drag
                        dragMomentum={true}
                        whileDrag={{ scale: 1.08, zIndex: 99999999, cursor: 'grabbing' }}
                        initial={{
                          opacity: 0,
                          scale: 0.15,
                          filter: 'blur(14px)',
                          x: 0,
                          y: 0,
                          rotate: 0,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          filter: 'blur(0px)',
                          x: target.x,
                          y: target.y,
                          rotate: target.rotate,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.15,
                          filter: 'blur(14px)',
                          x: 0,
                          y: 0,
                          rotate: 0,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 240,
                          damping: 22,
                          opacity: { duration: 0.28 },
                          filter: { duration: 0.28 },
                          delay: index * 0.04,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className={`folder-floating-item-frame ${
                            item.isTransparent || folder.isMinecraft
                              ? 'is-transparent-badge'
                              : item.aspect === 'portrait'
                              ? 'is-doc-card'
                              : 'is-photo-card'
                          }`}
                        >
                          <img
                            src={item.src}
                            alt={item.title}
                            className={`folder-floating-clean-img ${
                              item.isTransparent || folder.isMinecraft
                                ? 'is-transparent-img'
                                : item.aspect === 'portrait'
                                ? 'is-doc-img'
                                : 'is-photo-img'
                            }`}
                            draggable={false}
                          />
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <motion.div
                    className="folder-empty-floating-notice"
                    initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
                    transition={{ duration: 0.22 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MinecraftBlockIcon className="empty-icon" />
                    <p className="empty-title">Minecraft Launcher</p>
                    <p className="empty-desc">No snapshots uploaded yet. Click anywhere to return.</p>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}

// Exported FolderBadges Component
export function FolderBadges({ className = '' }: { className?: string }) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)

  return (
    <div className={`folder-badges-dock ${className}`}>
      {FOLDERS_DATA.map((folder) => (
        <SingleFolderBadge
          key={folder.id}
          folder={folder}
          isOpen={activeFolderId === folder.id}
          onToggle={() =>
            setActiveFolderId(activeFolderId === folder.id ? null : folder.id)
          }
        />
      ))}
    </div>
  )
}
