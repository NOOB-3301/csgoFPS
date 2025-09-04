import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import MapLoader from './MapLoader'
import Player from './Player'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'

const Game = () => {
  return (
    <div className="w-screen h-screen relative">
      <Canvas>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Suspense>
          <Physics debug>
            <MapLoader url='src/assets/de_dust_2_with_real_light.glb' />
            <Player position={[10, 10, 0]} />
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  )
}

export default Game