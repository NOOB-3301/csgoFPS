import React, { useEffect, useState, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody, TrimeshCollider } from '@react-three/rapier'
import * as THREE from 'three'

interface MapLoaderProps {
  url: string
  onMapLoaded?: () => void
}

const MapLoader = ({ url, onMapLoaded }: MapLoaderProps) => {
  const { scene, error } = useGLTF(url)
  const [colliderReady, setColliderReady] = useState(false)

  // Extract geometry data for TrimeshCollider - FIXED VERSION
  const geometryData = useMemo(() => {
    if (!scene) return null

    const allVertices: number[] = []
    const allIndices: number[] = []
    let currentIndex = 0

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry.clone()
        
        // Apply world matrix to vertices for correct positioning
        child.updateWorldMatrix(true, false)
        geometry.applyMatrix4(child.matrixWorld)
        
        // Ensure geometry has position attribute
        if (!geometry.attributes.position) {
          console.warn('Geometry missing position attribute')
          return
        }
        
        const vertices = geometry.attributes.position.array
        const indices = geometry.index?.array
        
        // Add vertices
        for (let i = 0; i < vertices.length; i++) {
          allVertices.push(vertices[i])
        }
        
        // Add indices - FIXED LOGIC
        if (indices) {
          // Use existing indices with offset
          for (let i = 0; i < indices.length; i++) {
            allIndices.push(indices[i] + currentIndex)
          }
        } else {
          // Generate indices for non-indexed geometry
          for (let i = 0; i < vertices.length / 3; i++) {
            allIndices.push(currentIndex + i)
          }
        }
        
        currentIndex += vertices.length / 3
      }
    })

    if (allVertices.length === 0) {
      console.warn('No geometry found for collision detection')
      return null
    }

    console.log(`Generated trimesh with ${allVertices.length / 3} vertices and ${allIndices.length / 3} triangles`)

    return {
      vertices: new Float32Array(allVertices),
      indices: new Uint32Array(allIndices)
    }
  }, [scene])

  useEffect(() => {
    if (error) {
      console.error('Error loading map:', error)
      return
    }

    if (scene && geometryData) {
      console.log('Map loaded with TrimeshCollider')
      setColliderReady(true)
      
      if (onMapLoaded) {
        setTimeout(() => onMapLoaded(), 100)
      }
    }
  }, [scene, error, geometryData, onMapLoaded])

  // Error fallback - ALWAYS PROVIDE GROUND
  if (error) {
    console.error('Failed to load map, using fallback ground')
    return (
      <RigidBody type="fixed" position={[0, 0, 0]} userData={{ type: 'ground' }}>
        <mesh>
          <boxGeometry args={[50, 2, 50]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <TrimeshCollider args={[
          new Float32Array([
            -25, 1, -25,  25, 1, -25,  25, 1, 25,  -25, 1, 25,  // top face
            -25, -1, -25, -25, -1, 25,  25, -1, 25,  25, -1, -25  // bottom face
          ]),
          new Uint32Array([
            0, 1, 2,  0, 2, 3,  // top face
            4, 5, 6,  4, 6, 7   // bottom face
          ])
        ]} />
      </RigidBody>
    )
  }

  // Loading fallback - ALWAYS PROVIDE GROUND
  if (!scene || !colliderReady || !geometryData) {
    if (!scene) {
      console.log("scene")
    }else if (!colliderReady) {
      console.log('collider ready')
    }else {
      console.log("geometrydata")
    }
    return (
      <RigidBody type="fixed" position={[0, 0, 0]} userData={{ type: 'loading' }}>
        <mesh>
          <boxGeometry args={[20, 2, 20]} />
          <meshStandardMaterial color="blue" transparent opacity={0.5} />
        </mesh>
        <TrimeshCollider args={[
          new Float32Array([
            -10, 1, -10,  10, 1, -10,  10, 1, 10,  -10, 1, 10,  // top face
            -10, -1, -10, -10, -1, 10,  10, -1, 10,  10, -1, -10  // bottom face
          ]),
          new Uint32Array([
            0, 1, 2,  0, 2, 3,  // top face
            4, 5, 6,  4, 6, 7   // bottom face
          ])
        ]} />
      </RigidBody>
    )
  }

  return (
    <>
      {/* Visual representation */}
      <primitive 
        object={scene} 
        position={[0, 0, 0]}
        scale={[1, 1, 1]}
      />
      
      {/* Physics collider with TrimeshCollider */}
      <RigidBody 
        type="fixed" 
        position={[0, 0, 0]}
        userData={{ type: 'map', name: 'de_dust2' }}
      >
        <TrimeshCollider 
          args={[geometryData.vertices, geometryData.indices]}
          restitution={0.1}
          friction={0.8}
        />
      </RigidBody>
      
      {/* Emergency ground plane at Y=-10 */}
      <RigidBody type="fixed" position={[0, -10, 0]} userData={{ type: 'emergency_ground' }}>
        <mesh>
          <boxGeometry args={[200, 1, 200]} />
          <meshStandardMaterial color="brown" transparent opacity={0.3} />
        </mesh>
        <TrimeshCollider args={[
          new Float32Array([
            -100, 0.5, -100,  100, 0.5, -100,  100, 0.5, 100,  -100, 0.5, 100,
            -100, -0.5, -100, -100, -0.5, 100,  100, -0.5, 100,  100, -0.5, -100
          ]),
          new Uint32Array([
            0, 1, 2,  0, 2, 3,  // top face
            4, 5, 6,  4, 6, 7   // bottom face
          ])
        ]} />
      </RigidBody>
    </>
  )
}

export default MapLoader