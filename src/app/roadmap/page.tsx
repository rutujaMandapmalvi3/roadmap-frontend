//displays the React Flow roadmap

'use client' 

  import { ReactFlow } from '@xyflow/react'                                                                                                   
  import '@xyflow/react/dist/style.css'  
                                                                                                                                              
  import { useSearchParams } from 'next/navigation'

    export default function Roadmap() {                                                                                                         
    const searchParams = useSearchParams()                  
    const raw = searchParams.get('data')
    const parsed = raw ? JSON.parse(decodeURIComponent(raw)) : null
    const roadmap = parsed?.roadmap ?? null   
    console.log('roadmap:', roadmap)                                                                      
   
    if (!roadmap) return <p>No roadmap data found.</p>  
    
  function buildGraph(roadmap: any) {                                                                                                         
    const nodes: any[] = []                                                                                                                   
    const edges: any[] = []                                                                                                                   
    let y = 0                                                                                                                                 
                                                                                                                                              
    roadmap.phases.forEach((phase: any, phaseIndex: number) => {                                                                                      
      const phaseId = `phase-${phaseIndex}`
      nodes.push({ id: phaseId, position: { x: 0, y }, data: { label: `${phase.title} (${phase.duration})` } })                               
      y += 100                                                                                                                                
   
      phase.milestones.forEach((milestone: any, mi: number) => {                                                                              
        const milestoneId = `milestone-${phaseIndex}-${mi}`         
        nodes.push({ id: milestoneId, position: { x: 300, y }, data: { label: milestone.title } })                                            
        edges.push({ id: `e-${phaseId}-${milestoneId}`, source: phaseId, target: milestoneId })                                               
        y += 100
      })                                                                                                                                      
    })                                                      

    return { nodes, edges }                                                                                                                   
  }
                                                            
                                         
  const { nodes, edges } = buildGraph(roadmap)                                                                                                
                                                                                                                                              
  return (                                                                                                                                    
    <main style={{ width: '100vw', height: '100vh' }}>      
      <ReactFlow nodes={nodes} edges={edges} fitView />                                                                                       
    </main>
  )                                                                                                                                        
  }