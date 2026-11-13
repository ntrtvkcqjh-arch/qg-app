"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import Decor from "./Decor";
import Personnage from "./Personnage";
import Associee from "./Associee";
import { CoucheEtiquettes, Projecteur } from "./Etiquettes";
import { useJeu } from "@/lib/store";

export default function Cabinet3D() {
  const agents = useJeu((s) => s.etat?.agents ?? []);
  const vitesse = useJeu((s) => s.etat?.vitesse ?? 1);
  const selection = useJeu((s) => s.selectionAgent);
  const selectionner = useJeu((s) => s.selectionner);
  const selectionnerPiece = useJeu((s) => s.selectionnerPiece);

  return (
    <div className="scene-3d">
      <Canvas shadows dpr={[1, 2]} onPointerMissed={() => selectionner(null)}>
        <color attach="background" args={["#eef1f5"]} />
        <OrthographicCamera
          makeDefault
          position={[22.5, 22, 17.5]}
          zoom={38}
          near={-100}
          far={200}
        />
        <OrbitControls
          target={[2.5, 0, -2.5]}
          enableDamping
          minZoom={18}
          maxZoom={90}
          minPolarAngle={0.45}
          maxPolarAngle={1.15}
          screenSpacePanning
        />
        <hemisphereLight args={["#ffffff", "#d6cbb8", 0.9]} />
        <directionalLight
          position={[12, 22, 10]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-18}
          shadow-camera-right={18}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-bias={-0.0004}
        />
        <Decor onPiece={selectionnerPiece} />
        {agents.map((a, i) => (
          <Personnage
            key={a.id}
            agent={a}
            index={i}
            selectionne={selection === a.id}
            vitesseJeu={vitesse}
            onClick={selectionner}
          />
        ))}
        <Associee />
        <Projecteur />
      </Canvas>
      <CoucheEtiquettes />
    </div>
  );
}
