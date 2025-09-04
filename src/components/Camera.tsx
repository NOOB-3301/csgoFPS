import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, Euler } from 'three'

interface FPSCameraProps {
  position?: [number, number, number]
  sensitivity?: number
  movementSpeed?: number
}

const FPSCamera = ({ 
  position = [0, 2, 5], 
  sensitivity = 0.002,
  movementSpeed = 5 
}: FPSCameraProps) => {
  const { camera } = useThree()
  
  // Mouse state for camera rotation
  const mouseState = useRef({
    x: 0,
    y: 0,
    pitch: 0,
    yaw: 0
  })
  
  // Keyboard state for camera movement
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    q: false, // up
    e: false  // down
  })

  useEffect(() => {
    // Set initial camera position
    camera.position.set(...position)
    
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
        case 'KeyQ':
          keys.current.q = true
          break
        case 'KeyE':
          keys.current.e = true
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
        case 'KeyQ':
          keys.current.q = false
          break
        case 'KeyE':
          keys.current.e = false
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
  }, [camera, position])

  useFrame((state, delta) => {
    const mouse = mouseState.current
    
    // Update camera rotation based on mouse movement
    mouse.yaw -= mouse.x * sensitivity
    mouse.pitch -= mouse.y * sensitivity
    
    // Clamp pitch to prevent over-rotation
    mouse.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouse.pitch))
    
    // Reset mouse movement
    mouse.x = 0
    mouse.y = 0
    
    // Apply rotation to camera
    camera.rotation.set(mouse.pitch, mouse.yaw, 0)
    
    // Calculate movement direction based on camera rotation
    const direction = new Vector3()
    const forward = new Vector3(0, 0, -1).applyEuler(camera.rotation)
    const right = new Vector3(1, 0, 0).applyEuler(camera.rotation)
    const up = new Vector3(0, 1, 0)
    
    // Apply movement based on keys pressed
    if (keys.current.w) direction.add(forward)
    if (keys.current.s) direction.sub(forward)
    if (keys.current.a) direction.sub(right)
    if (keys.current.d) direction.add(right)
    if (keys.current.q) direction.add(up)
    if (keys.current.e) direction.sub(up)
    
    // Normalize and apply speed
    if (direction.length() > 0) {
      direction.normalize()
      direction.multiplyScalar(movementSpeed * delta)
      camera.position.add(direction)
    }
  })

  return null // This component doesn't render anything
}

export default FPSCamera