import React from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

interface MapLoaderProps {
  url: string
  onMapLoaded?: () => void
}

const MapLoader = ({ url, onMapLoaded }: MapLoaderProps) => {
  console.log("map starting to load")
  const gltf = useGLTF(url)

  React.useEffect(() => {
    if (gltf.scene) {
      console.log("Map is loaded")
      console.log("Map is loaded")
      console.log("Map scene:", gltf.scene)
      console.log("Map bounds:", gltf.scene.children)
      onMapLoaded?.()
    }
  }, [gltf.scene, onMapLoaded])

  if (!gltf.scene) {
    return null
  }

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive 
        object={gltf.scene} 
        position={[0, 0, 0]}
        scale={[1, 1, 1]}
      />
    </RigidBody>
  )
}

export default MapLoader