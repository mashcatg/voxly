export function WaveVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="h-full w-full flex items-center justify-center gap-1 hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className={`h-full w-1 bg-primary/20 rounded-full transform origin-bottom transition-all duration-75 ${
            isActive ? "animate-wave" : "h-2"
          }`}
          style={{
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  )
}
