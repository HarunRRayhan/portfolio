import { Button } from "@/Components/ui/button"
import { motion } from "framer-motion"
import { Github, Linkedin, Twitter, ArrowRight } from 'lucide-react'
import { Link } from '@inertiajs/react'
import React, { useState, useEffect, useCallback, useRef } from 'react'

interface Logo {
  name: string;
  image: string;
  scale: number;
  targetScale: number;
  scaleSpeed: number;
}

interface Node {
  id: number;
  x: number;
  y: number;
  logo: Logo;
  angle: number;
  scale: number;
  targetScale: number;
  scaleSpeed: number;
}

interface Edge {
  source: {
    x: number;
    y: number;
    scale: number;
  };
  target: {
    x: number;
    y: number;
    scale: number;
  };
}

const phrases = [
  'Senior Software Engineer',
  '12x AWS Certified',
  'DevOps Engineer',
  'Software Consultant',
  'Cloud Specialist'
];

const LOGO_SIZE = 55;

const logos: Logo[] = [
  { name: 'DevOps', image: 'https://cdn.worldvectorlogo.com/logos/devops-2.svg' },
  { name: 'AWS', image: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg' },
  { name: 'Docker', image: 'https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png' },
  { name: 'Kubernetes', image: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg' },
  { name: 'Terraform', image: 'https://www.vectorlogo.zone/logos/terraformio/terraformio-icon.svg' },
  { name: 'GitHub', image: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg' },
  { name: 'Golang', image: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg' },
  { name: 'Jenkins', image: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Jenkins_logo.svg' },
].map(logo => ({
  ...logo,
  scale: 1,
  targetScale: 1,
  scaleSpeed: Math.random() * 0.02 + 0.01
}));

export function HeroSectionV2() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef(Date.now());

  const typeWriter = useCallback(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    
    if (isPaused) return;

    if (!isDeleting && currentText === currentPhrase) {
      setIsPaused(true);
      setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 3000);
      return;
    }

    if (isDeleting && currentText === '') {
      setIsDeleting(false);
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
      return;
    }

    setCurrentText(prev => 
      isDeleting
        ? prev.slice(0, -1)
        : currentPhrase.slice(0, prev.length + 1)
    );
  }, [currentPhraseIndex, currentText, isDeleting, isPaused]);

  useEffect(() => {
    const timer = setTimeout(typeWriter, isDeleting ? 75 : 150);
    return () => clearTimeout(timer);
  }, [typeWriter, isDeleting]);

  useEffect(() => {
    const calculateNodePosition = (centerX: number, centerY: number, radius: number, angle: number) => {
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { x, y };
    };

    const updatePositions = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.45;

      const newNodes = logos.map((logo, index) => {
        const angle = (index / logos.length) * 2 * Math.PI;
        const position = calculateNodePosition(centerX, centerY, radius, angle);
        return {
          id: index,
          ...position,
          logo: logo,
          angle: angle,
          scale: logo.scale,
          targetScale: logo.targetScale,
          scaleSpeed: logo.scaleSpeed
        };
      });

      setNodes(newNodes);
      setEdges(generateEdges(newNodes));
    };

    const generateEdges = (nodes: Node[]) => {
      const edges: Edge[] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const sourceScale = nodes[i].scale;
          const targetScale = nodes[j].scale;
          
          edges.push({
            source: {
              x: nodes[i].x,
              y: nodes[i].y,
              scale: sourceScale
            },
            target: {
              x: nodes[j].x,
              y: nodes[j].y,
              scale: targetScale
            }
          });
        }
      }
      return edges;
    };

    const updateScales = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      setNodes(prevNodes => {
        return prevNodes.map(node => {
          const logo = logos[node.id];
      
          let newScale = node.scale;
          if (Math.abs(logo.targetScale - node.scale) < 0.0005) {
            logo.targetScale = Math.random() * 0.2 + 0.9;
            logo.scaleSpeed = Math.random() * 0.02 + 0.01;
          }
      
          if (node.scale < logo.targetScale) {
            newScale = Math.min(node.scale + logo.scaleSpeed * deltaTime, logo.targetScale);
          } else {
            newScale = Math.max(node.scale - logo.scaleSpeed * deltaTime, logo.targetScale);
          }
      
          logo.scale = newScale;
      
          return {
            ...node,
            scale: newScale
          };
        });
      });
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);

    const animate = () => {
      updateScales();
      
      setNodes(prevNodes => {
        const updatedNodes = prevNodes.map(node => {
          const newAngle = node.angle + 0.0005;
          const container = containerRef.current;
          if (!container) return node;

          const rect = container.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const radius = Math.min(rect.width, rect.height) * 0.45;
          
          const position = calculateNodePosition(centerX, centerY, radius, newAngle);

          return {
            ...node,
            ...position,
            angle: newAngle
          };
        });
        setEdges(generateEdges(updatedNodes));
        return updatedNodes;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updatePositions);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#86D2F1] via-[#7C3AED] to-[#8B5CF6]">
      {/* Background animation */}
      <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg width="100%" height="100%">
          {edges.map((edge, index) => (
            <line
              key={index}
              x1={edge.source.x}
              y1={edge.source.y}
              x2={edge.target.x}
              y2={edge.target.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}
        </svg>
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: `translate(-50%, -50%) scale(${node.scale})`,
              transition: 'all 4s ease-out'
            }}
          >
            <img
              src={node.logo.image}
              alt={node.logo.name}
              width={LOGO_SIZE}
              height={LOGO_SIZE}
              className="w-14 h-14 rounded-full bg-white/10 p-2"
            />
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-screen relative z-20 text-center">
        <motion.div 
          className="max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
            <span className="text-xl md:text-2xl block mb-2">Hi <span className="text-[#6EE7B7]">👋</span>, I'm</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#6EE7B7]">Harun R. Rayhan</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-[#6EE7B7] h-10">
            {currentText}
            {!isPaused && <span className="animate-blink">_</span>}
          </h2>
          <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-2xl mx-auto">
            A software engineer, architect, and consultant with over a decade of experience. I will make your applications and softwares run smoothly at scale with (virtually) unlimited users.
          </p>

          {/* Reviews section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
              <div className="flex items-center gap-1 text-white">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < 5 ? 'text-yellow-400' : 'text-gray-400'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-1 text-sm font-semibold">4.8</span>
                <span className="mx-2 text-gray-300">by 120+ clients</span>
              </div>
            </div>
            <Link 
              href="#testimonials" 
              className="group flex items-center gap-2 text-white hover:text-[#6EE7B7] transition-colors duration-300"
            >
              Checkout what clients says
              <ArrowRight className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          
          {/* Buttons section */}
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/contact">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full sm:w-auto relative overflow-hidden group bg-white/10 backdrop-blur-sm border border-[#6EE7B7]/20 hover:bg-white/20 text-white transition-all duration-300"
                >
                  Contact Me
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6EE7B7] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/book-session">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full sm:w-auto relative overflow-hidden group !bg-white/90 !text-[#7C3AED] hover:!bg-[#9F7AEA] hover:!text-white transition-all duration-300"
                >
                  Book a Session
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#6EE7B7] to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Social links */}
          <div className="flex justify-center space-x-4">
            <motion.a 
              href="https://github.com/yourusername" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="GitHub Profile"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Github className="w-8 h-8 text-[#6EE7B7] hover:text-white transition-colors" />
            </motion.a>
            <motion.a 
              href="https://twitter.com/yourusername" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Twitter Profile"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Twitter className="w-8 h-8 text-[#6EE7B7] hover:text-white transition-colors" />
            </motion.a>
            <motion.a 
              href="https://linkedin.com/in/yourusername" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="LinkedIn Profile"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Linkedin className="w-8 h-8 text-[#6EE7B7] hover:text-white transition-colors" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 