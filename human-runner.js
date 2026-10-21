/* Rigged human runner for Blue Gold Rush (Three.js, global build).
 * Loads assets/CesiumMan.glb (skinned, 19 bones), re-skins it at load time with
 * vertex colours (Team polo, joggers, sneakers, skin) and attaches procedural
 * hair / beard / face parts and the team emblem decal to the skeleton.
 * Exposes window.HumanRunner.load(THREE, opts) -> Promise<runner>. */
(function(root){
  'use strict';
  const MODEL_URL='./assets/CesiumMan.glb';
  const EMBLEM_URL='./assets/team-emblem.png';
  const LOADER_URL='./vendor/GLTFLoader.js';
  const TARGET_HEIGHT=1.86; // metres in game units (feet at y=0)

  const COL={
    skin:0xd2a07a,white:0xf4f6fa,blue:0x1f4fa8,gold:0xe2b23c,navy:0x131a2c,
    shoe:0xffffff,hair:0x1a130e,beard:0x7b6049,dark:0x20140e
  };

  function loadScript(src){
    return new Promise((res,rej)=>{
      const s=document.createElement('script');s.src=src;s.async=true;
      s.onload=()=>res();s.onerror=()=>{s.remove();rej(new Error('Failed to load '+src))};
      document.head.appendChild(s);
    });
  }
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const damp=(k,dt)=>1-Math.exp(-k*dt);

  async function load(THREE,opts){
    opts=opts||{};
    if(!THREE.GLTFLoader)await loadScript(LOADER_URL);
    if(!THREE.GLTFLoader)throw new Error('GLTFLoader unavailable');
    const gltf=await new Promise((res,rej)=>new THREE.GLTFLoader().load(opts.modelUrl||MODEL_URL,res,undefined,rej));
    let emblemImg=null;
    try{emblemImg=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('emblem'));i.src=opts.emblemUrl||EMBLEM_URL})}
    catch(e){console.warn('[human] emblem texture missing',e.message)}
    return build(THREE,gltf,emblemImg);
  }

  function build(THREE,gltf,emblemImg){
    const scene=gltf.scene;
    let skinned=null;const bones={};
    scene.traverse(o=>{if(o.isSkinnedMesh&&!skinned)skinned=o;if(o.isBone)bones[o.name]=o});
    if(!skinned||!skinned.skeleton||!gltf.animations.length)throw new Error('Model has no skinned mesh or animation');
        const B={
      head:bones.Skeleton_neck_joint_2,
      thL:bones.leg_joint_L_1,thR:bones.leg_joint_R_1,knL:bones.leg_joint_L_2,knR:bones.leg_joint_R_2,
      anL:bones.leg_joint_L_3,anR:bones.leg_joint_R_3,
      shL:bones.Skeleton_arm_joint_L__4_,shR:bones.Skeleton_arm_joint_R,
      elL:bones.Skeleton_arm_joint_L__3_,elR:bones.Skeleton_arm_joint_R__2_,
      chest:bones.Skeleton_torso_joint_2,chest3:bones.torso_joint_3
    };
    for(const k in B)if(!B[k])throw new Error('Missing bone '+k);

    scene.updateMatrixWorld(true);

    // ---- re-skin with vertex colours (model space: +x forward, +y left, +z up) ----
    const geo=skinned.geometry;
    const pos=geo.attributes.position,nor=geo.attributes.normal,ji=geo.attributes.skinIndex,jw=geo.attributes.skinWeight;
    const jointNames=skinned.skeleton.bones.map(b=>b.name);
    const col=new Float32Array(pos.count*3);
    const c=new THREE.Color();
    const dom=new Array(pos.count);
    for(let i=0;i<pos.count;i++){
      let m=0,best=-1;
      const wv=[jw.getX(i),jw.getY(i),jw.getZ(i),jw.getW(i)];for(let k=0;k<4;k++){if(wv[k]>best){best=wv[k];m=k}}
      const n=jointNames[[ji.getX(i),ji.getY(i),ji.getZ(i),ji.getW(i)][m]];dom[i]=n;
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),ay=Math.abs(y);
      let hex=COL.skin;
      if(n==='Skeleton_neck_joint_2'){hex=COL.skin}
      else if(n==='Skeleton_neck_joint_1'){hex=z<1.145?COL.blue:COL.skin}
      else if(n==='torso_joint_3'){hex=z>=1.085?(Math.floor((z-1.085)/.016)%2?COL.white:COL.blue):(ay>.088?COL.blue:COL.white)}
      else if(n==='Skeleton_torso_joint_2'){hex=ay>.088?COL.blue:COL.white}
      else if(n==='Skeleton_torso_joint_1'){hex=z<.72?COL.navy:(ay>.095?COL.blue:COL.white)}
      else if(/arm_joint_(L__4_|R)$/.test(n)){hex=ay<.235?COL.white:ay<.27?COL.blue:COL.skin}
      else if(/leg_joint_[LR]_[12]$/.test(n)){
        const o=ay-.075;hex=o>.045?COL.gold:o>.033?COL.blue:(z<.14&&z>.09?COL.blue:COL.navy);
      }
      else if(/leg_joint_[LR]_[35]$/.test(n)){
        hex=z<.01?COL.blue:(z>.028&&z<.05&&ay>.1&&n.endsWith('5')?COL.gold:COL.shoe);
      }
      c.setHex(hex);
      col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
    }
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const oldMat=skinned.material;
    const bodyMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:0});
    skinned.material=bodyMat;skinned.castShadow=true;skinned.frustumCulled=false;
    if(oldMat){if(oldMat.map)oldMat.map.dispose();oldMat.dispose()}

    // ---- helpers to place accessories in bone-local space ----
    // bind-space (vertex space) -> bone-local space: boneInverse * bindMatrix
    const bindToBone=b=>new THREE.Matrix4().multiplyMatrices(skinned.skeleton.boneInverses[skinned.skeleton.bones.indexOf(b)],skinned.bindMatrix);
    const headRest=bindToBone(B.head),chestRest=bindToBone(B.chest);
    const toBone=(rest,m)=>new THREE.Matrix4().multiplyMatrices(rest,m);
    const placed=(obj,rest,p,q,s)=>{
      const m=new THREE.Matrix4().compose(p,q||new THREE.Quaternion(),s||new THREE.Vector3(1,1,1));
      obj.matrixAutoUpdate=false;obj.matrix.copy(toBone(rest,m));obj.matrixWorldNeedsUpdate=true;
    };
    // head-surface samples (bind space)
    const headIdx=[];for(let i=0;i<pos.count;i++)if(dom[i]==='Skeleton_neck_joint_2')headIdx.push(i);
    const surfX=(y,z,idx,r)=>{let mx=-9;for(const i of idx){if(Math.abs(pos.getY(i)-y)<r&&Math.abs(pos.getZ(i)-z)<r&&pos.getX(i)>mx)mx=pos.getX(i)}return mx};
    const surfXneg=(y,z,idx,r)=>{let mn=9;for(const i of idx){if(Math.abs(pos.getY(i)-y)<r&&Math.abs(pos.getZ(i)-z)<r&&pos.getX(i)<mn)mn=pos.getX(i)}return mn};
    const torsoIdx=[];for(let i=0;i<pos.count;i++)if(/torso_joint_[123]$/.test(dom[i]))torsoIdx.push(i);

    // merged sphere clusters (1 draw call each)
    const sphereBase=new THREE.SphereGeometry(1,7,5);
    function cluster(points,mat){
      const vN=sphereBase.attributes.position.count,iN=sphereBase.index.count;
      const P=new Float32Array(points.length*vN*3),N=new Float32Array(points.length*vN*3),I=new Uint32Array(points.length*iN);
      points.forEach((p,k)=>{
        for(let v=0;v<vN;v++){
          const nx=sphereBase.attributes.normal.getX(v),ny=sphereBase.attributes.normal.getY(v),nz=sphereBase.attributes.normal.getZ(v);
          const o=(k*vN+v)*3;
          P[o]=p.x+nx*p.rx;P[o+1]=p.y+ny*p.ry;P[o+2]=p.z+nz*p.rz;N[o]=nx;N[o+1]=ny;N[o+2]=nz;
        }
        for(let t=0;t<iN;t++)I[k*iN+t]=sphereBase.index.getX(t)+k*vN;
      });
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setIndex(new THREE.BufferAttribute(I,1));
      const m=new THREE.Mesh(g,mat);m.castShadow=false;m.frustumCulled=false;return m;
    }
    const thin=(cands,minD)=>{const out=[];for(const p of cands){let ok=true;for(const q of out){const dx=p.x-q.x,dy=p.y-q.y,dz=p.z-q.z;if(dx*dx+dy*dy+dz*dz<minD*minD){ok=false;break}}if(ok)out.push(p)}return out};
    // head centre / rough ellipsoid (from vertex data)
    const hc={x:0,y:0,z:1.335};
    const hairCand=[],beardCand=[],hairBase=[];
    for(const i of headIdx){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const nx=nor.getX(i),ny=nor.getY(i),nz=nor.getZ(i);
            // hair: top & back of the skull, leaving the face (front, below the hairline) bare
      if((z>1.40&&!(x>.07&&z<1.43))||(x<-.02&&z>1.27)||(z>1.34&&Math.abs(y)>.14&&x<.05)){
        hairCand.push({x:x+nx*.02,y:y+ny*.02,z:z+nz*.02,rx:.026,ry:.026,rz:.026});
        hairBase.push({x:x,y:y,z:z,rx:.04,ry:.04,rz:.04});
      }
      // beard: jaw, chin and cheeks on the front/lower half of the face
      if(x>-.02&&z<1.305&&z>1.18&&!(x>.09&&z>1.255&&Math.abs(y)<.04)){
        beardCand.push({x:x+nx*.01,y:y+ny*.01,z:z+nz*.01,rx:.018,ry:.018,rz:.016});
      }
    }
    // deterministic shuffle so thinning does not bias toward index order
    const shuf=(a)=>{let s=12345;for(let i=a.length-1;i>0;i--){s=(Math.imul(s,1103515245)+12345)&0x7fffffff;const j=s%(i+1);const t=a[i];a[i]=a[j];a[j]=t}return a};
    const hairMat=new THREE.MeshStandardMaterial({color:COL.hair,roughness:.9});
    const beardMat=new THREE.MeshStandardMaterial({color:COL.beard,roughness:.95});
    const skinMat=new THREE.MeshStandardMaterial({color:COL.skin,roughness:.7});
    const darkMat=new THREE.MeshStandardMaterial({color:COL.dark,roughness:.6});
    const whiteMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5});
    const headGroup=new THREE.Group();headGroup.name='headParts';
    const hairSpheres=thin(shuf(hairCand),.034).concat(thin(shuf(hairBase),.04));
    const hairMesh=cluster(hairSpheres,hairMat);
    const beardMesh=cluster(thin(shuf(beardCand),.022),beardMat);
    // mustache over the upper lip
    const fx=surfX(0,1.265,headIdx,.02);
    const must=[];for(let k=-3;k<=3;k++)must.push({x:fx+.004,y:k*.016,z:1.262-Math.abs(k)*.002,rx:.016,ry:.014,rz:.01});
    const mustMesh=cluster(must,beardMat);
    // eyes, brows, nose
    const eyeZ=1.375,eyeY=.055,ex=surfX(eyeY,eyeZ,headIdx,.02);
    const eyes=[],whites=[],brows=[];
    for(const s of[-1,1]){
      whites.push({x:ex-.001,y:s*eyeY,z:eyeZ,rx:.008,ry:.018,rz:.011});
      eyes.push({x:ex+.004,y:s*eyeY,z:eyeZ,rx:.006,ry:.009,rz:.009});
      brows.push({x:ex-.001,y:s*eyeY,z:eyeZ+.032,rx:.007,ry:.026,rz:.006});
    }
    const eyeMesh=cluster(eyes,darkMat),whiteMesh=cluster(whites,whiteMat),browMesh=cluster(brows,hairMat);
    const nx0=surfX(0,1.315,headIdx,.02);
    const noseMesh=cluster([{x:nx0+.004,y:0,z:1.315,rx:.02,ry:.018,rz:.022}],skinMat);
    for(const m of[hairMesh,beardMesh,mustMesh,eyeMesh,whiteMesh,browMesh,noseMesh])headGroup.add(m);
    // everything above is in bind/model space -> convert once into head-bone space
    placed(headGroup,headRest,new THREE.Vector3());
    B.head.add(headGroup);

    // ---- team emblem decal (wearer's chest only) ----
    const decals=[];
    if(emblemImg){
      const tex=new THREE.Texture(emblemImg);tex.needsUpdate=true;if(THREE.SRGBColorSpace)tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
      const dm=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:.7,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,depthWrite:false});
      const backingMat=new THREE.MeshBasicMaterial({color:0xffffff,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,depthWrite:false});
      const mk=(r,y,z,front)=>{
        const sx=front?surfX(y,z,torsoIdx,.03):surfXneg(y,z,torsoIdx,.03);
        if(Math.abs(sx)>1)return;
        const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),front?Math.PI/2:-Math.PI/2);
        const dir=front?1:-1;
        // white backing disc keeps the blue emblem readable against the blue panels / from far away
        const back=new THREE.Mesh(new THREE.CircleGeometry(r*1.18,28),backingMat);back.name='emblemBacking';
        placed(back,chestRest,new THREE.Vector3(sx+dir*.003,y,z),q);B.chest.add(back);decals.push(back);
        const mesh=new THREE.Mesh(new THREE.CircleGeometry(r,28),dm);mesh.name=front?'emblemFront':'emblemBack';
        placed(mesh,chestRest,new THREE.Vector3(sx+dir*.006,y,z),q);
        B.chest.add(mesh);decals.push(mesh);
      };
      mk(.05,.07,.975,true);    // wearer's left chest only
      // No rear decal; leave the model's back and any gear unobstructed.
    }

    // ---- model placement: facing -Z, feet at y=0, scaled to TARGET_HEIGHT ----
    const modelFix=new THREE.Group();modelFix.name='humanModel';
    modelFix.add(scene);scene.rotation.y=Math.PI; // glTF model faces +Z; the game runs toward -Z
    const hipH=.88,scaleF=TARGET_HEIGHT/1.51;
    modelFix.scale.setScalar(scaleF);
    const pivot=new THREE.Group();pivot.name='humanPivot';
    pivot.add(modelFix);modelFix.position.y=-hipH*scaleF;pivot.position.y=hipH*scaleF;
    const rootGroup=new THREE.Group();rootGroup.name='humanRunner';rootGroup.add(pivot);
    const baseY=hipH*scaleF; // pivot rest height

    // ---- animation ----
    const mixer=new THREE.AnimationMixer(scene);
    const runAct=mixer.clipAction(gltf.animations[0]);runAct.setLoop(THREE.LoopRepeat,Infinity);runAct.play();
    // a second copy of the clip, frozen on its most neutral (legs-together) frame, used as the cross-fade target
    // for jump / slide / crash so the model never falls back to its T-pose bind pose
    const holdAct=mixer.clipAction(gltf.animations[0].clone());holdAct.play();holdAct.timeScale=0;
    (function pickNeutral(){
      const dur=gltf.animations[0].duration,va=new THREE.Vector3(),vb=new THREE.Vector3();let best=0,bestD=1e9;
      for(let i=0;i<32;i++){
        const t=dur*i/32;runAct.time=t;runAct.weight=1;holdAct.weight=0;mixer.update(0);scene.updateMatrixWorld(true);
        B.anL.getWorldPosition(va);B.anR.getWorldPosition(vb);
        const d=Math.abs(va.z-vb.z)+Math.abs(va.y-vb.y);if(d<bestD){bestD=d;best=t}
      }
      holdAct.time=best;runAct.time=0;
    })();

    const AX_SIDE=new THREE.Vector3(1,0,0),AX_FWD=new THREE.Vector3(0,0,1); // scene-local: +X = character's left, +Z = forward
    // rotate a bone about an axis given in model (scene-local) space; + about the side axis swings limbs backward
    const qa=new THREE.Quaternion(),qb=new THREE.Quaternion(),qc=new THREE.Quaternion(),qd=new THREE.Quaternion();
    function rotate(bone,axis,ang){
      if(!ang)return;
      bone.parent.updateWorldMatrix(true,false);
      bone.parent.getWorldQuaternion(qa);
      scene.getWorldQuaternion(qb);
      qa.premultiply(qb.invert());                // parent orientation relative to model space
      qc.setFromAxisAngle(axis,ang);              // delta in model space
      qd.copy(qa).invert().multiply(qc).multiply(qa); // delta expressed in parent space
      bone.quaternion.premultiply(qd);
      bone.updateMatrixWorld(true);
    }

    const W={air:0,slide:0,crash:0,land:0,lean:0,idle:0};

    function update(dt,s){
      // s: {mode,dx,y,vy,airborne,slide,landT,crashed,speed}
      dt=Math.min(dt,.05);
      const crashed=!!s.crashed,sliding=!crashed&&s.slide>0,air=!crashed&&!sliding&&s.airborne,landing=!crashed&&!sliding&&!air&&s.landT>0;
      const idle=s.mode==='idle';
      const k=damp(14,dt),kSlow=damp(8,dt);
      W.air+=((air?1:0)-W.air)*k;
      W.slide+=((sliding?1:0)-W.slide)*k;
      W.crash+=((crashed?1:0)-W.crash)*damp(10,dt);
      W.land+=((landing?Math.sin(Math.min(1,s.landT/.2)*Math.PI):0)-W.land)*damp(30,dt);
      W.idle+=((idle?1:0)-W.idle)*kSlow;
      W.lean+=(clamp(s.dx||0,-1.5,1.5)-W.lean)*damp(12,dt);

      // cross-fade the run cycle: full while running, reduced in air/slide, frozen on crash
      const runW=1-clamp(W.air*.6+W.slide*.85+W.crash,0,1);
      runAct.setEffectiveWeight(runW);holdAct.setEffectiveWeight(1-runW);
      const rate=idle?.9:(2.1+clamp((s.speed||10)-10,0,24)*.045);
      runAct.timeScale=crashed?0:rate;
      mixer.update(dt);
      B.head.scale.setScalar(.86); // slimmer head: more natural athletic proportions
      scene.updateMatrixWorld(true);

      const runK=clamp(1-W.air-W.slide-W.crash,0,1)*(1-W.idle*.85);
      // run style: bent elbows
      rotate(B.elL,AX_SIDE,-.9*runK);rotate(B.elR,AX_SIDE,-.9*runK);
      rotate(B.shL,AX_SIDE,-.1*runK);rotate(B.shR,AX_SIDE,-.1*runK);
      // jump: lead knee up, trailing leg tucked, arms thrown up
      const a=W.air,up=(s.vy||0)>0?1:.55;
      rotate(B.thL,AX_SIDE,-1.3*a*up);rotate(B.knL,AX_SIDE,1.5*a);
      rotate(B.thR,AX_SIDE,.2*a);rotate(B.knR,AX_SIDE,1.6*a);
      rotate(B.thL,AX_FWD,-.35*a);rotate(B.thR,AX_FWD,.35*a);
      rotate(B.shL,AX_SIDE,-2.2*a*up);rotate(B.shR,AX_SIDE,-2.0*a*up);rotate(B.shL,AX_FWD,-.6*a);rotate(B.shR,AX_FWD,.6*a);
      rotate(B.elL,AX_SIDE,-.35*a);rotate(B.elR,AX_SIDE,-.35*a);
      // slide: legs stretched forward, arms forward
      const sl=W.slide;
      rotate(B.thL,AX_SIDE,-1.0*sl);rotate(B.thR,AX_SIDE,-.8*sl);rotate(B.knL,AX_SIDE,.5*sl);rotate(B.knR,AX_SIDE,.7*sl);
      rotate(B.shL,AX_SIDE,-1.2*sl);rotate(B.shR,AX_SIDE,-1.2*sl);rotate(B.shL,AX_FWD,-.4*sl);rotate(B.shR,AX_FWD,.4*sl);
      // landing absorb
      const ld=W.land;
      rotate(B.thL,AX_SIDE,-.8*ld);rotate(B.thR,AX_SIDE,-.8*ld);rotate(B.knL,AX_SIDE,1.3*ld);rotate(B.knR,AX_SIDE,1.3*ld);
      rotate(B.shL,AX_SIDE,-.5*ld);rotate(B.shR,AX_SIDE,-.5*ld);
      // crash / game-over: stumble back, arms flung up, knees buckled
      const cr=W.crash;
      rotate(B.thL,AX_SIDE,-1.0*cr);rotate(B.thR,AX_SIDE,-.5*cr);rotate(B.knL,AX_SIDE,1.5*cr);rotate(B.knR,AX_SIDE,1.3*cr);
      rotate(B.shL,AX_SIDE,-2.4*cr);rotate(B.shR,AX_SIDE,-2.2*cr);
      rotate(B.shL,AX_FWD,-.3*cr);rotate(B.shR,AX_FWD,.3*cr);
      // lane change: lead arm swings out, body rolls into the turn
      const ln=clamp(W.lean,-1,1)*runK;
      rotate(B.shL,AX_FWD,-.7*Math.max(0,-ln)-.0);rotate(B.shR,AX_FWD,.7*Math.max(0,ln));
      // head stays level against body pitch; lane-change head tilt
      rotate(B.head,AX_SIDE,-(.15*W.slide)+.2*cr);

      // whole-body pose (pitch about the hips / roll for lane changes / height)
      const pitch=-(.2*runK+.15*W.land)+.8*sl+.7*cr-.05*a;
      const lean=clamp(-W.lean*.3,-.4,.4)+(-.5*cr);
      pivot.rotation.x+=(pitch-pivot.rotation.x)*damp(18,dt);
      pivot.rotation.z+=(lean-pivot.rotation.z)*damp(14,dt);
      const dropY=-.5*sl-.32*cr-.12*W.land;
      pivot.position.y+=((baseY+dropY)-pivot.position.y)*damp(20,dt);
    }

    function dispose(){
      mixer.stopAllAction();mixer.uncacheRoot(scene);
      scene.traverse(o=>{if(o.isMesh){o.geometry&&o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(!m)return;if(m.map)m.map.dispose();m.dispose()})}});
      if(rootGroup.parent)rootGroup.parent.remove(rootGroup);
    }
    // debug handle for automated tests
    const debug={bones:B,scene,pivot,weights:W,decals,hairCount:hairSpheres.length,boneCount:skinned.skeleton.bones.length,rotate};
    return {root:rootGroup,update,dispose,debug,height:TARGET_HEIGHT};
  }

  root.HumanRunner={load};
})(window);
