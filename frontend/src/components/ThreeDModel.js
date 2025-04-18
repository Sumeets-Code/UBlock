// ThreeDModel.js
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

const Model = ({ url }) => {
  const { scene } = useGLTF(url);

  // DEBUG: Log to confirm the scene is loading
  console.log("GLTF Scene:", scene);

  return (
    <primitive object={scene} scale={1.5} position={[0, -1, 0]} />
  );
};

const ThreeDModel = ({ modelUrl }) => {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <Model url={modelUrl} />
        <OrbitControls autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  );
};

export default ThreeDModel;