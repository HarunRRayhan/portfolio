"use client"

import { motion } from "framer-motion"
import { Infinity } from "lucide-react"

const skills = [
  {
    name: "AWS",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
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
    logo: "https://www.datocms-assets.com/2885/1620155116-brandhcterraformverticalcolor.svg",
    isHot: true,
  },
  {
    name: "Kubernetes",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg",
  },
  {
    name: "Docker",
    logo: "https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png",
  },
  {
    name: "Python",
    logo: "https://s3.dualstack.us-east-2.amazonaws.com/pythondotorg-assets/media/community/logos/python-logo-only.png",
  },
  {
    name: "Serverless",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-k1tNzFgi9ighjAso7EoeAnEi6R1XXq.png",
    isHot: true,
  },
  {
    name: "Go",
    logo: "https://go.dev/blog/go-brand/Go-Logo/SVG/Go-Logo_Blue.svg",
  },
  {
    name: "Jenkins",
    logo: "https://www.jenkins.io/images/logos/jenkins/jenkins.svg",
  },
  {
    name: "Node.js",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg",
  },
  {
    name: "Nginx",
    logo: "https://nginx.org/nginx.png",
  },
  {
    name: "Laravel",
    logo: "https://laravel.com/img/logomark.min.svg",
  },
  {
    name: "Git",
    logo: "https://git-scm.com/images/logos/downloads/Git-Icon-1788C.png",
  },
  {
    name: "CI/CD Pipeline",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-9dH2DZcYQfHw4Uynm8frBvqRls9IIY.png",
  },
  {
    name: "GitHub Actions",
    logo: "https://github.githubassets.com/images/modules/site/features/actions-icon-actions.svg",
  },
  {
    name: "Cypress",
    logo: "https://asset.brandfetch.io/idIq_kF0rb/idv3zwmSiY.jpeg",
  },
]

const FireIcon = () => (
  <div className="w-6 h-6 relative group-hover:scale-125 transition-transform duration-300">
    <img
      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icons8-fire-9d0OLGwPQF2HB61Cdm3fVI4DQfC4xQ.gif"
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
                    <skill.icon className="w-12 h-12 text-[#06B6D4] animate-pulse" />
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