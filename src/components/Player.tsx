import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import { Vector3 } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'

interface PlayerProps {
  position?: [number, number, number]
  onPositionChange?: (position: Vector3) => void
}

const Player = ({ position = [0, 5, 0], onPositionChange }: PlayerProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const { camera } = useThree()
  const { rapier, world } = useRapier()
  
  // Collision state
  const [collisionInfo, setCollisionInfo] = useState<{
    isGrounded: boolean,
    touchingWall: boolean,
    surfaceNormal: Vector3 | null,
    surfaceType: string | null
  }>({
    isGrounded: false,
    touchingWall: false,
    surfaceNormal: null,
    surfaceType: null
  })
  
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
    lastGroundTime: 0
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

    const handlePointerLock = () => {
      if (document.pointerLockElement === null) {
        document.body.requestPointerLock()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handlePointerLock)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handlePointerLock)
    }
  }, [])

  // Enhanced collision detection with TrimeshCollider
  const checkCollisions = (playerPosition: any, currentTime: number) => {
    // Ground check with more precision for TrimeshCollider
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
    
    const isGrounded = groundHit !== null && groundHit.toi < 1.2
    
    if (isGrounded) {
      playerState.current.lastGroundTime = currentTime
    }
    
    // Wall detection for TrimeshCollider (multiple rays for better detection)
    const directions = [
      new rapier.Vector3(1, 0, 0),   // right
      new rapier.Vector3(-1, 0, 0),  // left
      new rapier.Vector3(0, 0, 1),   // forward
      new rapier.Vector3(0, 0, -1),  // backward
      new rapier.Vector3(0.707, 0, 0.707),   // diagonal
      new rapier.Vector3(-0.707, 0, 0.707),  // diagonal
      new rapier.Vector3(0.707, 0, -0.707),  // diagonal
      new rapier.Vector3(-0.707, 0, -0.707)  // diagonal
    ]
    
    let touchingWall = false
    let surfaceNormal: Vector3 | null = null
    
    for (const direction of directions) {
      const wallRayOrigin = new rapier.Vector3(
        playerPosition.x, 
        playerPosition.y + 0.4, 
        playerPosition.z
      )
      
      const wallHit = world.castRay(
        new rapier.Ray(wallRayOrigin, direction),
        0.6,
        true
      )
      
      if (wallHit && wallHit.toi < 0.5) {
        touchingWall = true
        surfaceNormal = new Vector3(-direction.x, -direction.y, -direction.z)
        break
      }
    }
    
    return {
      isGrounded,
      touchingWall,
      surfaceNormal,
      surfaceType: groundHit ? 'trimesh' : null
    }
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
    
    // Check collisions with TrimeshCollider
    const newCollisionInfo = checkCollisions(playerPosition, currentTime)
    setCollisionInfo(newCollisionInfo)
    
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
      const movementMultiplier = newCollisionInfo.isGrounded ? 1 : movementConfig.airControl
      
      rigidBody.setLinvel({
        x: direction.x * movementMultiplier,
        y: currentVelocity.y, // Preserve vertical velocity
        z: direction.z * movementMultiplier
      }, true)
    } else if (newCollisionInfo.isGrounded) {
      // Apply friction when grounded and not moving
      rigidBody.setLinvel({
        x: currentVelocity.x * 0.8,
        y: currentVelocity.y,
        z: currentVelocity.z * 0.8
      }, true)
    }
    
    // Enhanced jump logic with coyote time
    const coyoteTime = 0.1 // Allow jumping shortly after leaving ground
    const canCoyoteJump = currentTime - playerState.current.lastGroundTime < coyoteTime
    
    if (keys.current.space && playerState.current.jumpCooldown <= 0) {
      if (newCollisionInfo.isGrounded || canCoyoteJump) {
        // Normal jump
        rigidBody.setLinvel({
          x: currentVelocity.x,
          y: movementConfig.jumpForce,
          z: currentVelocity.z
        }, true)
        playerState.current.jumpCooldown = 0.3
      } else if (newCollisionInfo.touchingWall && newCollisionInfo.surfaceNormal) {
        // Wall jump with TrimeshCollider
        const wallJumpForce = newCollisionInfo.surfaceNormal.multiplyScalar(8)
        rigidBody.setLinvel({
          x: currentVelocity.x + wallJumpForce.x,
          y: movementConfig.jumpForce * 0.8,
          z: currentVelocity.z + wallJumpForce.z
        }, true)
        playerState.current.jumpCooldown = 0.5
      }
    }
    
    // Set camera position to player head level
    camera.position.set(
      playerPosition.x,
      playerPosition.y + 0.8, // Eye level
      playerPosition.z
    )
    
    // Set camera rotation for FPS view
    camera.rotation.set(mouse.pitch, mouse.yaw, 0)
    
    // Notify parent of position change
    if (onPositionChange) {
      onPositionChange(new Vector3(playerPosition.x, playerPosition.y, playerPosition.z))
    }
  })

  // Collision event handlers for TrimeshCollider
  const handleCollisionEnter = (event: any) => {
    const otherBody = event.other.rigidBodyObject?.userData
    if (otherBody?.type === 'map') {
      console.log('Player touched TrimeshCollider surface:', otherBody.name)
    }
  }

  const handleCollisionExit = (event: any) => {
    const otherBody = event.other.rigidBodyObject?.userData
    if (otherBody?.type === 'map') {
      console.log('Player left TrimeshCollider surface:', otherBody.name)
    }
  }

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
      onCollisionEnter={handleCollisionEnter}
      onCollisionExit={handleCollisionExit}
    >
      <CapsuleCollider 
        args={[0.8, 0.4]} 
        restitution={0.1}
        friction={0.8}
      />
      
      {/* Debug visualization */}
      <mesh visible={true}>
        <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
        <meshStandardMaterial 
          color={
            collisionInfo.isGrounded ? "#00ff00" : 
            collisionInfo.touchingWall ? "#ffff00" : 
            "#ff0000"
          } 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Status indicator */}
      <mesh position={[0, 1.5, 0]} visible={true}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial 
          color={
            collisionInfo.isGrounded ? "green" : 
            collisionInfo.touchingWall ? "yellow" : "red"
          } 
        />
      </mesh>
    </RigidBody>
  )
}

export default Player