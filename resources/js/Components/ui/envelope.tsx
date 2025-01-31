import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface EnvelopeProps {
    onComplete: () => void;
}

export const Envelope = ({ onComplete }: EnvelopeProps) => {
    const containerVariants = {
        initial: { 
            scale: 0.5,
            opacity: 0,
            y: 100
        },
        animate: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        },
        exit: {
            scale: 0.5,
            opacity: 0,
            transition: {
                duration: 0.3
            }
        }
    };

    return (
        <motion.div
            className="text-center"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-gray-900">Message Sent Successfully!</h3>
                    <p className="text-gray-600 text-lg">
                        Thank you for reaching out. We'll get back to you soon.
                    </p>
                </div>
                <motion.button
                    onClick={onComplete}
                    className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Submit Another Request
                </motion.button>
            </div>
        </motion.div>
    );
}; 