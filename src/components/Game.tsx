import React, { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import MapLoader from './MapLoader'
import Player from './Player'

const Game = () => {
  const [controlsActive, setControlsActive] = useState(false)

  useEffect(() => {
    const handlePointerLockChange = () => {
      setControlsActive(document.pointerLockElement === document.body)
    }
    
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange)
  }, [])

  return (
    <div className="w-screen h-screen relative">
      {!controlsActive && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded z-10">
          Click to play - WASD to move, Mouse to look, Space to jump
        </div>
      )}
      
      <Canvas
        camera={{ 
          position: [0, 5, 10], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]} debug={true}>
            {/* Map with TrimeshCollider */}
            <MapLoader url="src/assets/de_dust_2_with_real_light.glb" />
            
            {/* Player with physics */}
            <Player position={[0, 5, 0]} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Game