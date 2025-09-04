import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import MapLoader from './MapLoader'
import { OrbitControls } from '@react-three/drei'

const Game = () => {
  return (
    <div className="w-screen h-screen relative">
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Physics gravity={[0, -9.81, 0]} debug>
          <Suspense fallback={null}>
            <MapLoader url='src/assets/de_dust_2_with_real_light.glb' />
            <OrbitControls />
          </Suspense>
        </Physics>
      </Canvas>
    </div>
  )
}

export default Game