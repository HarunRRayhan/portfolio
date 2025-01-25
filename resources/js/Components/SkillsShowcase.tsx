"use client"

import { motion } from "framer-motion"
import { Infinity, CircleDot } from "lucide-react"

type Skill = {
  name: string
  logo?: string
  isIcon?: boolean
  icon?: any
  isHot?: boolean
  iconColors?: string[]
}

const skills: Skill[] = [
  {
    name: "AWS",
    logo: "/images/skills/aws.svg",
    isHot: true,
  },
  {
    name: "DevOps",
    isIcon: true,
    icon: Infinity,
    isHot: true,
  },
  {
    name: "Terraform",
    logo: "/images/skills/terraform.svg",
    isHot: true,
  },
  {
    name: "Kubernetes",
    logo: "/images/skills/kubernetes.svg",
  },
  {
    name: "Docker",
    logo: "/images/skills/docker.png",
  },
  {
    name: "Python",
    logo: "/images/skills/python.png",
  },
  {
    name: "Serverless",
    logo: "/images/skills/serverless.png",
    isHot: true,
  },
  {
    name: "Go",
    logo: "/images/skills/go.svg",
  },
  {
    name: "Jenkins",
    logo: "/images/skills/jenkins.svg",
  },
  {
    name: "Node.js",
    logo: "/images/skills/nodejs.svg",
  },
  {
    name: "Nginx",
    logo: "/images/skills/nginx.png",
  },
  {
    name: "Laravel",
    logo: "/images/skills/laravel.svg",
  },
  {
    name: "Git",
    logo: "/images/skills/git.png",
  },
  {
    name: "CI/CD Pipeline",
    isIcon: true,
    icon: Infinity,
    iconColors: ["#3B82F6", "#F97316"],
  },
  {
    name: "GitHub Actions",
    logo: "/images/skills/github-actions.svg",
  },
  {
    name: "Cypress",
    logo: "/images/skills/cypress.jpg",
  }
]

const FireIcon = () => (
  <div className="w-6 h-6 relative group-hover:scale-125 transition-transform duration-300">
    <img
      src="/images/icons/fire.gif"
      alt="Hot skill indicator"
      className="w-full h-full object-contain"
    />
  </div>
)

export function SkillsShowcase() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-3xl lg:text-4xl font-bold text-center mb-16 text-gray-900"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Technical Expertise
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.name}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <div className="group relative">
                <div className="w-24 h-24 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm hover:scale-110 transition-transform duration-300 p-4">
                  {skill.isIcon ? (
                    <div className="relative">
                      {skill.iconColors ? (
                        <>
                          <skill.icon className="w-12 h-12 absolute text-[#3B82F6]" style={{ transform: 'translateX(-4px)' }} />
                          <skill.icon className="w-12 h-12 absolute text-[#F97316]" style={{ transform: 'translateX(4px)' }} />
                        </>
                      ) : (
                        <skill.icon className="w-12 h-12 text-[#06B6D4] animate-pulse" />
                      )}
                    </div>
                  ) : (
                    <img
                      src={skill.logo || "/placeholder.svg"}
                      alt={`${skill.name} logo`}
                      className="w-full h-full object-contain"
                    />
                  )}
                  {skill.isHot && (
                    <div className="absolute -top-2 -right-2">
                      <FireIcon />
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 