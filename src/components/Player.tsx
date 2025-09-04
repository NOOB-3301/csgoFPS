import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import { Vector3 } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'

interface PlayerProps {
  position?: [number, number, number]
}

const Player = ({ position = [0, 5, 0] }: PlayerProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const { camera } = useThree()
  const { rapier, world } = useRapier()
  
  // Mouse state for FPS camera
  const mouseState = useRef({
    x: 0,
    y: 0,
    sensitivity: 0.002,
    pitch: 0,
    yaw: 0
  })
  
  // Keyboard state
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false
  })

  // Movement settings
  const movementConfig = {
    speed: 8,
    jumpForce: 12,
    sprintMultiplier: 1.5,
    airControl: 0.3
  }

  // Player state
  const playerState = useRef({
    jumpCooldown: 0,
    lastGroundTime: 0,
    isGrounded: false
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          keys.current.w = true
          break
        case 'KeyA':
          keys.current.a = true
          break
        case 'KeyS':
          keys.current.s = true
          break
        case 'KeyD':
          keys.current.d = true
          break
        case 'Space':
          keys.current.space = true
          e.preventDefault()
          break
        case 'ShiftLeft':
          keys.current.shift = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          keys.current.w = false
          break
        case 'KeyA':
          keys.current.a = false
          break
        case 'KeyS':
          keys.current.s = false
          break
        case 'KeyD':
          keys.current.d = false
          break
        case 'Space':
          keys.current.space = false
          break
        case 'ShiftLeft':
          keys.current.shift = false
          break
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === document.body) {
        mouseState.current.x = e.movementX
        mouseState.current.y = e.movementY
      }
    }

    const handleClick = () => {
      if (document.pointerLockElement === null) {
        document.body.requestPointerLock()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [])

  // Ground check function
  const checkGrounded = (playerPosition: { x: number; y: number; z: number }) => {
    const groundRayOrigin = new rapier.Vector3(
      playerPosition.x, 
      playerPosition.y + 0.1, 
      playerPosition.z
    )
    const groundRayDirection = new rapier.Vector3(0, -1, 0)
    
    const groundHit = world.castRay(
      new rapier.Ray(groundRayOrigin, groundRayDirection),
      1.3,
      true
    )
    
    return groundHit !== null && groundHit.timeOfImpact < 1.2
  }

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return

    const rigidBody = rigidBodyRef.current
    const mouse = mouseState.current
    const currentTime = state.clock.elapsedTime
    
    // Update camera rotation (FPS mouse look)
    mouse.yaw -= mouse.x * mouse.sensitivity
    mouse.pitch -= mouse.y * mouse.sensitivity
    
    // Clamp pitch to prevent over-rotation
    mouse.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouse.pitch))
    
    // Reset mouse movement
    mouse.x = 0
    mouse.y = 0
    
    // Get player position and velocity
    const playerPosition = rigidBody.translation()
    const currentVelocity = rigidBody.linvel()
    
    // Check if grounded
    const isGrounded = checkGrounded(playerPosition)
    playerState.current.isGrounded = isGrounded
    
    if (isGrounded) {
      playerState.current.lastGroundTime = currentTime
    }
    
    // Update jump cooldown
    if (playerState.current.jumpCooldown > 0) {
      playerState.current.jumpCooldown -= delta
    }
    
    // Calculate movement direction in world space
    const direction = new Vector3()
    
    // Get forward and right vectors from camera rotation
    const forward = new Vector3(
      -Math.sin(mouse.yaw),
      0,
      -Math.cos(mouse.yaw)
    )
    const right = new Vector3(
      Math.cos(mouse.yaw),
      0,
      -Math.sin(mouse.yaw)
    )
    
    if (keys.current.w) direction.add(forward)
    if (keys.current.s) direction.sub(forward)
    if (keys.current.a) direction.sub(right)
    if (keys.current.d) direction.add(right)
    
    // Normalize direction and apply speed
    if (direction.length() > 0) {
      direction.normalize()
      
      // Apply sprint multiplier
      const currentSpeed = keys.current.shift 
        ? movementConfig.speed * movementConfig.sprintMultiplier 
        : movementConfig.speed
      
      direction.multiplyScalar(currentSpeed)
      
      // Apply movement based on grounded state
      const movementMultiplier = isGrounded ? 1 : movementConfig.airControl
      
      rigidBody.setLinvel({
        x: direction.x * movementMultiplier,
        y: currentVelocity.y, // Preserve vertical velocity
        z: direction.z * movementMultiplier
      }, true)
    } else if (isGrounded) {
      // Apply friction when grounded and not moving
      rigidBody.setLinvel({
        x: currentVelocity.x * 0.8,
        y: currentVelocity.y,
        z: currentVelocity.z * 0.8
      }, true)
    }
    
    
    // Set camera position to player head level
    camera.position.set(
      playerPosition.x,
      playerPosition.y + 1.0, // Eye level (standing height)
      playerPosition.z
    )
    
    // Set camera rotation for FPS view
    camera.rotation.set(mouse.pitch, mouse.yaw, 0)
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="dynamic"
      mass={1}
      lockRotations
      enabledRotations={[false, false, false]}
      linearDamping={0.1}
      angularDamping={0.1}
      userData={{ type: 'player' }}
    >
      <CapsuleCollider 
        args={[0.3, 0.20]} 
        restitution={0.1}
        friction={0.8}
      />
      
      {/* Debug visualization - visible player body */}
      <mesh visible={false}>
        <capsuleGeometry args={[0.20, 0.3, 4, 6]} />
        <meshStandardMaterial 
          color={playerState.current.isGrounded ? "#00ff00" : "#ff0000"} 
          transparent 
          opacity={0.3}
        />
      </mesh>
    </RigidBody>
  )
}

export default Player