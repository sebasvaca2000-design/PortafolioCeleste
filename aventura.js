/* Geometría y rutas del mundo. Las coordenadas corresponden al SVG de 1000 × 625. */
(function (root) {
  const nodes = {
    inicio: [404,579], entrada: [330,518], puente: [418,454],
    contacto: [619,420], descanso: [510,386], arco: [540,350],
    diario: [649,340], cruce: [486,301], mirador: [467,280],
    cruceAlto: [493,255], proyectos: [574,227],
    bifurca: [478,222], sobre: [361,218], altos: [658,233], habilidades: [755,219]
  };
  const edges = [
    ['inicio','entrada'],['entrada','puente'],['puente','contacto'],
    ['contacto','descanso'],['descanso','arco'],['arco','diario'],['arco','cruce'],
    ['cruce','mirador'],['mirador','cruceAlto'],['cruceAlto','proyectos'],
    ['proyectos','bifurca'],['bifurca','sobre'],['proyectos','altos'],['altos','habilidades']
  ];
  const directions = {left:[-1,0],up:[0,-1],down:[0,1],right:[1,0]};
  const edgeId = (a,b) => [a,b].sort().join('--');
  const distance = (a,b) => Math.hypot(nodes[a][0]-nodes[b][0],nodes[a][1]-nodes[b][1]);
  const neighbors = id => edges.filter(e=>e.includes(id)).map(e=>e[0]===id?e[1]:e[0]);
  function route(from,to) {
    if (!nodes[from] || !nodes[to]) return [];
    const costs = {[from]:0}, previous = {}, queue = Object.keys(nodes);
    while (queue.length) {
      queue.sort((a,b)=>(costs[a]??Infinity)-(costs[b]??Infinity));
      const node = queue.shift();
      if (costs[node] == null) break;
      if (node===to) {
        const path = [to];
        while (path[0]!==from) path.unshift(previous[path[0]]);
        return path;
      }
      for (const id of neighbors(node)) {
        const cost=costs[node]+distance(node,id);
        if (cost<(costs[id]??Infinity)) {costs[id]=cost;previous[id]=node;}
      }
    }
    return [];
  }
  function step(from,dir,previous) {
    const vector=directions[dir];
    if(!vector || !nodes[from]) return null;
    const [x,y]=nodes[from];
    const choices=neighbors(from).map(id=>{
      const [a,b]=nodes[id]; const dx=a-x,dy=b-y;
      return {id,score:(dx*vector[0]+dy*vector[1])/Math.hypot(dx,dy)};
    }).filter(o=>o.score>.18).sort((a,b)=>b.score-a.score);
    return (choices.find(o=>o.id!==previous)||choices[0])?.id??null;
  }
  const game = {nodes,edges,edgeId,distance,neighbors,route,step};
  if (typeof module !== 'undefined') module.exports=game;
  else root.AVENTURA=game;
})(globalThis);
