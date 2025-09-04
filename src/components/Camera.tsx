import { PointerLockControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react'
import { Camera } from 'three'

const CameraComponent = () => {
  const controlsRef = useRef<{ isLocked: boolean; getObject: () => Camera }>(null);
  const [moveForward, setMoveForward] = useState(false);
  const [moveBackward, setMoveBackward] = useState(false);
  const [moveLeft, setMoveLeft] = useState(false);
  const [moveRight, setMoveRight] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': setMoveForward(true); break;
        case 'KeyS': setMoveBackward(true); break;
        case 'KeyA': setMoveLeft(true); break;
        case 'KeyD': setMoveRight(true); break;
        default: break;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': setMoveForward(false); break;
        case 'KeyS': setMoveBackward(false); break;
        case 'KeyA': setMoveLeft(false); break;
        case 'KeyD': setMoveRight(false); break;
        default: break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  useFrame(() => {
    if (controlsRef.current && controlsRef.current.isLocked) {
      const camera = controlsRef.current.getObject();
      const speed = 0.1;

      if (moveForward) camera.translateZ(-speed);
      if (moveBackward) camera.translateZ(speed);
      if (moveLeft) camera.translateX(-speed);
      if (moveRight) camera.translateX(speed);
    }
  });
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <PointerLockControls ref={controlsRef as any}/>
  )
}

export default CameraComponent