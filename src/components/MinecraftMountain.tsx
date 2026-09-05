export function MinecraftMountain({ className = '' }: { className?: string }) {
  return (
    <div className={`minecraft-mountain-frame ${className}`} aria-label="Minecraft Mountain space">
      <div className="minecraft-mountain-placeholder">
        <span className="mountain-placeholder-text">MINECRAFT MOUNTAIN HERE</span>
      </div>
    </div>
  )
}
