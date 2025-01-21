'use client'

import { motion } from 'framer-motion'
import { Code2, Cloud, Lightbulb } from 'lucide-react'

const skills = [
  {
    icon: Code2,
    title: "17+ years as a software engineer",
    description: "Polyglot engineer specializing in Backend Development, DevOps practices, and Cloud technologies. Experienced in building and scaling enterprise applications, with a focus on AWS solutions."
  },
  {
    icon: Cloud,
    title: "12x AWS Certified Expert",
    description: "Comprehensive mastery of AWS services and architecture. Holds all AWS certifications, demonstrating deep expertise in cloud infrastructure, security, and DevOps methodologies."
  },
  {
    icon: Lightbulb,
    title: "10+ years of technical leadership",
    description: "Led and mentored engineering teams across multiple organizations. Expertise in architectural decisions, team building, and implementing best practices in cloud-native environments."
  }
]

const experiences = [
  {
    icon: Code2,
    title: "17+ years as a software engineer",
    description: "Polyglot engineer that's written code for Fortune 50 companies, startups (including his own), and everything in between. Harun enjoys mentoring and leading engineers as well as building out effective teams."
  },
  {
    icon: Cloud,
    title: "7+ years of building on AWS",
    description: "Harun builds, deploys and monitors complex solutions on AWS. Certifications? He got them all... in six weeks. He's also a contributor to the AWS CDK and is a big proponent of IaC."
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

export function SkillsSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <svg
        className="hidden lg:block absolute right-0 top-0 transform translate-x-1/3 -translate-y-1/4"
        width="404"
        height="784"
        fill="none"
        viewBox="0 0 404 784"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="skills-grid"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width="4" height="4" className="text-[#7C3AED]" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="404" height="784" fill="url(#skills-grid)" className="opacity-10" />
      </svg>
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Harun&apos;s got (technical) skills.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            These days, he's focusing on cloud architecture and DevOps practices, particularly with AWS. He's passionate about infrastructure as code (IaC), especially in Terraform and AWS CDK, and building scalable, resilient systems.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 mb-24">
          {/* Left Column - Skills */}
          <div className="max-w-2xl">
            <h3 className="text-3xl font-bold text-gray-900 mb-12">
              Builder. Expert. Mentor.
            </h3>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-12"
            >
              {skills.map((skill, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex gap-6"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center">
                      <skill.icon className="w-6 h-6 text-[#7C3AED]" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {skill.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {skill.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - AWS Certifications Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center"
          >
            <img
              src="/images/aws-certifications.png"
              alt="AWS Certifications"
              className="w-full h-auto max-w-lg hover:scale-105 transition-transform duration-300"
            />
          </motion.div>
        </div>
      </div>
      
      {/* Experience Section */}
    
      <svg
        className="hidden lg:block absolute left-0 bottom-0 transform -translate-x-1/4 translate-y-0"
        width="404"
        height="484"
        fill="none"
        viewBox="0 0 404 484"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="experience-grid"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width="4" height="4" className="text-[#7C3AED]" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="404" height="484" fill="url(#experience-grid)" className="opacity-10" />
      </svg>
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Doer. Learner. Mentor.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Harun is happiest when he's building things and learning. Sometimes he needs to go head down and accomplish something that he isn't sure is possible.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 mb-0">
          {/* Left Column - Professional Certifications Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center"
          >
            <img
              src="/images/professional-certifications.png"
              alt="Professional Certifications - Terraform Associate, Certified Scrum Developer, and Certified Scrum Master"
              className="w-full h-auto max-w-[250px] hover:scale-105 transition-transform duration-300"
            />
          </motion.div>

          {/* Right Column - Experience Items */}
          <div className="max-w-2xl">
            <h3 className="text-3xl font-bold text-gray-900 mb-12">
              Experience & Impact
            </h3>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-12"
            >
              {experiences.map((experience, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex gap-6"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center">
                      <experience.icon className="w-6 h-6 text-[#7C3AED]" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {experience.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {experience.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
} 