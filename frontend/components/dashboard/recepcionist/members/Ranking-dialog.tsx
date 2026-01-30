import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Gift } from "lucide-react"
import { useState } from "react"

interface TopAlumno {
  Nombre: string
  GymCoins: number
}

interface RankingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  top10Clases: TopAlumno[];
  top10Gimnasio: TopAlumno[];
}

// Componente de Confetti
function Confetti() {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#f97316', '#facc15', '#ef4444', '#ec4899', '#a855f7', '#3b82f6', '#22c55e'][Math.floor(Math.random() * 7)]
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 opacity-0"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(500px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  )
}

// Componente de Ruleta
function RouletteWheel({ 
  participants, 
  rotation, 
  spinning,
  showWinner
}: { 
  participants: TopAlumno[], 
  rotation: number, 
  spinning: boolean,
  showWinner: boolean
}) {
  const numParticipants = participants.length
  const segmentAngle = 360 / numParticipants
  
  const colors = [
    '#f97316', '#facc15', '#ef4444', '#ec4899', 
    '#a855f7', '#3b82f6', '#22c55e', '#14b8a6',
    '#6366f1', '#fb923c'
  ]

  return (
    <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] mx-auto">
      {/* Confetti cuando hay ganador */}
      {showWinner && <Confetti />}
      
      {/* Glow effect cuando hay ganador */}
      {showWinner && (
        <div className="absolute inset-0 rounded-full animate-pulse" style={{
          boxShadow: '0 0 60px 20px rgba(249, 115, 22, 0.5), 0 0 100px 40px rgba(250, 204, 21, 0.3)'
        }} />
      )}
      
      {/* Flecha indicadora */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
        <div 
          className={`w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[50px] border-t-red-600 drop-shadow-lg transition-transform duration-300 ${showWinner ? 'scale-110' : ''}`}
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
        />
      </div>
      
      {/* Ruleta */}
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full drop-shadow-2xl transition-all duration-500 ${showWinner ? 'scale-105' : ''}`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          filter: showWinner ? 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.6))' : 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
        }}
      >
        {/* Borde exterior decorativo */}
        <circle cx="100" cy="100" r="98" fill="none" stroke="#f97316" strokeWidth="3" />
        
        {participants.map((participant, i) => {
          const startAngle = i * segmentAngle - 90
          const endAngle = startAngle + segmentAngle
          const startRad = (startAngle * Math.PI) / 180
          const endRad = (endAngle * Math.PI) / 180
          
          const x1 = 100 + 95 * Math.cos(startRad)
          const y1 = 100 + 95 * Math.sin(startRad)
          const x2 = 100 + 95 * Math.cos(endRad)
          const y2 = 100 + 95 * Math.sin(endRad)
          
          const largeArc = segmentAngle > 180 ? 1 : 0
          
          // Calcular posición del texto (centro del segmento)
          const textAngle = startAngle + segmentAngle / 2
          const textRad = (textAngle * Math.PI) / 180
          const textRadius = 62
          const textX = 100 + textRadius * Math.cos(textRad)
          const textY = 100 + textRadius * Math.sin(textRad)
          
          return (
            <g key={i}>
              <path
                d={`M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[i % colors.length]}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={textX}
                y={textY}
                fill="white"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
              >
                {participant.Nombre.split(' ')[0]}
              </text>
            </g>
          )
        })}
        
        {/* Centro de la ruleta */}
        <circle cx="100" cy="100" r="22" fill="white" stroke="#f97316" strokeWidth="4" />
        <circle cx="100" cy="100" r="14" fill="#f97316" />
        <text x="100" y="100" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">🎰</text>
      </svg>
      
      {/* Luces decorativas alrededor */}
      {showWinner && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 rounded-full animate-ping"
              style={{
                backgroundColor: colors[i % colors.length],
                top: `${50 + 48 * Math.sin((i * 30 * Math.PI) / 180)}%`,
                left: `${50 + 48 * Math.cos((i * 30 * Math.PI) / 180)}%`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function RankingDialog({
  open,
  onOpenChange,
  top10Clases,
  top10Gimnasio
}: RankingDialogProps) {
  const [showRoulette, setShowRoulette] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<TopAlumno | null>(null)
  const [rotation, setRotation] = useState(0)

  // Crear lista de participantes con el primer puesto 3 veces (3x más chances)
  const getRouletteParticipants = () => {
    if (top10Gimnasio.length === 0) return []
    const firstPlace = top10Gimnasio[0]
    const rest = top10Gimnasio.slice(1)
    // Insertar el primer puesto 3 veces distribuido en la ruleta
    return [
      firstPlace,           // Posición 1
      ...rest.slice(0, 3),  // Posiciones 2-4
      firstPlace,           // Posición 5 (2da aparición del 1er puesto)
      ...rest.slice(3, 6),  // Posiciones 6-8
      firstPlace,           // Posición 9 (3ra aparición del 1er puesto)
      ...rest.slice(6)      // Resto
    ]
  }

  const rouletteParticipants = getRouletteParticipants()

  const startRoulette = () => {
    setShowRoulette(true)
    setWinner(null)
    setRotation(0)
    
    // Pequeño delay para abrir el modal antes de empezar a girar
    setTimeout(() => {
      setSpinning(true)
      
      // Seleccionar ganador aleatorio de la ruleta con pesos
      const randomIndex = Math.floor(Math.random() * rouletteParticipants.length)
      const selectedWinner = rouletteParticipants[randomIndex]
      
      // Calcular el ángulo para que el ganador quede en la flecha (arriba)
      const segmentAngle = 360 / rouletteParticipants.length
      const winnerSegmentCenter = randomIndex * segmentAngle + segmentAngle / 2
      
      // 5-8 vueltas completas + ajuste para que el ganador quede arriba (en 0°)
      const spinRotations = 5 + Math.floor(Math.random() * 4)
      const finalRotation = spinRotations * 360 + (360 - winnerSegmentCenter)
      
      setRotation(finalRotation)
      
      setTimeout(() => {
        setWinner(selectedWinner)
        setSpinning(false)
      }, 4000)
    }, 100)
  }

  const spinAgain = () => {
    setWinner(null)
    setRotation(0)
    
    setTimeout(() => {
      setSpinning(true)
      
      const randomIndex = Math.floor(Math.random() * rouletteParticipants.length)
      const selectedWinner = rouletteParticipants[randomIndex]
      
      const segmentAngle = 360 / rouletteParticipants.length
      const winnerSegmentCenter = randomIndex * segmentAngle + segmentAngle / 2
      
      const spinRotations = 5 + Math.floor(Math.random() * 4)
      const finalRotation = spinRotations * 360 + (360 - winnerSegmentCenter)
      
      setRotation(finalRotation)
      
      setTimeout(() => {
        setWinner(selectedWinner)
        setSpinning(false)
      }, 4000)
    }, 100)
  }

  const closeRoulette = () => {
    setShowRoulette(false)
    setRotation(0)
    setWinner(null)
    setSpinning(false)
  }

  const renderList = (list: TopAlumno[], labelKey: keyof TopAlumno, valueKey: keyof TopAlumno) => (
    <ul className="space-y-2">
      {list.map((alum, i) => (
        <li
          key={`${alum.Nombre}-${i}`}
          className="flex items-center justify-between bg-orange-50  dark:bg-zinc-900 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-100 transition"
        >
          <div className="flex items-center gap-3 dark:text-white">
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold
                ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-orange-400"}
              `}
            >
              {i + 1}
            </span>
            <span className="font-medium">{alum[labelKey]}</span>
          </div>
          <span className="text-sm font-semibold text-orange-600">
            {alum[valueKey]}
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg justify-center font-bold">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Ranking de Alumnos
            </DialogTitle>
          </DialogHeader>

          {/* GRID: dos columnas en desktop, una en mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2 dark:text-white">
                <Star className="w-4 h-4 text-orange-500 " />
                Top 10 Clases
              </h3>
              {renderList(top10Clases, "Nombre", "GymCoins")}
            </section>

            <section>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center justify-center gap-2 dark:text-white">
                <Star className="w-4 h-4 text-orange-500" />
                Top 10 Gimnasio
              </h3>
              {renderList(top10Gimnasio, "Nombre", "GymCoins")}
            </section>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={startRoulette} className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Sorteo
            </Button>
            <Button variant="orange" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Ruleta */}
      <Dialog open={showRoulette} onOpenChange={closeRoulette}>
        <DialogContent className="max-w-xl sm:max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl justify-center font-bold">
              <Gift className="w-6 h-6 text-orange-500" />
              Sorteo - Top 10 Gimnasio
            </DialogTitle>
          </DialogHeader>

          <div className="py-8 relative">
            <RouletteWheel 
              participants={rouletteParticipants} 
              rotation={rotation} 
              spinning={spinning}
              showWinner={!!winner && !spinning}
            />

            {/* Resultado */}
            {winner && !spinning && (
              <div className="mt-8 text-center">
                <div className="relative inline-block">
                  {/* Resplandor de fondo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur-lg opacity-75 animate-pulse" />
                  
                  <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-10 py-6 rounded-2xl shadow-2xl">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-4xl">🏆</span>
                    </div>
                    <p className="text-lg font-medium mb-2 mt-2">🎉 ¡FELICIDADES! 🎉</p>
                    <p className="text-3xl font-bold tracking-wide">{winner.Nombre}</p>
                    <p className="text-base mt-2 opacity-90 flex items-center justify-center gap-1">
                      <span>💰</span> GymCoins: {winner.GymCoins}
                    </p>
                    <div className="mt-3 flex justify-center gap-1">
                      {['🎊', '✨', '🎉', '✨', '🎊'].map((emoji, i) => (
                        <span key={i} className="text-xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{emoji}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {spinning && (
              <div className="mt-8 text-center">
                <p className="text-xl font-semibold text-gray-600 dark:text-gray-300 animate-pulse flex items-center justify-center gap-2">
                  Girando...
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            {!spinning && winner && (
              <Button variant="outline" onClick={spinAgain} className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Girar de nuevo
              </Button>
            )}
            {!spinning && (
              <Button variant="orange" onClick={closeRoulette}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
