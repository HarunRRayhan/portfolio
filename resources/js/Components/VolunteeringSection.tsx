"use client"

import { motion } from "framer-motion"
import { Award, Users } from "lucide-react"
import { getImageUrl } from "../lib/imageUtils"

export function VolunteeringSection() {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Community Involvement</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Giving back to the tech community through knowledge sharing and mentorship.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="rounded-xl border bg-gradient-to-br from-[#86D2F1]/5 to-[#7C3AED]/5 shadow p-8">
              <div className="flex items-start gap-8">
                <div className="w-32 h-32 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img
                    src={getImageUrl("/images/community/aws-community-builder.png")}
                    alt="AWS Community Builder"
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">AWS Community Builder</h3>
                  <p className="text-[#7C3AED] font-medium text-lg mb-2">Amazon Web Services (AWS)</p>
                  <p className="text-gray-600 text-lg mb-4">Mar 2022 - Present</p>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    AWS Community Builders are enthusiasts and emerging thought leaders who are passionate about AWS
                    technology, and cloud computing. Our work as content creators and evangelists supports and
                    encourages others in the broader technical community along their cloud journeys. By sharing our
                    thoughts and experiences, we also grow and network as a group. AWS also supports the Community
                    Builders through specialized webinars, panels, and resources.
                  </p>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#7C3AED] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-[#7C3AED]" />
                    </div>
                    <p className="text-gray-800 font-medium text-lg pt-1">
                      Recognized as a Top Content Contributor for Q2 2022 in the APJ Region
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 