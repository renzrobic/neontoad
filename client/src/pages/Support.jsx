import React from 'react';
import { motion } from 'framer-motion';

const Support = ({ title, content }) => {
 return (
 <div className="pt-24 md:pt-32 pb-20 min-h-screen bg-transparent px-6 md:px-16 lg:px-24">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="max-w-4xl mx-auto"
 >
 <h1 className="text-h2 md:text-h1 font-medium text-white mb-8 tracking-tight">{title}</h1>
 <div className="prose prose-invert max-w-none">
 <p className="text-white/90 text-h4 leading-relaxed mb-6 font-medium tracking-tight">
 Last Updated: May 10, 2026
 </p>
 <div className="space-y-8 text-white/90 leading-loose">
 <section>
 <h2 className="text-h3 font-medium text-white mb-4 tracking-tight">1. Overview</h2>
 <p className="font-medium tracking-tight">
 Welcome to NeonToad. This page outlines our {title.toLowerCase()}. We value your trust and strive to provide the best streaming experience while respecting your rights and choices.
 </p>
 </section>

 <section>
 <h2 className="text-h3 font-medium text-white mb-4 tracking-tight">2. Key Points</h2>
 <p className="font-medium tracking-tight">
 Our commitment to excellence means we constantly update our services. By using NeonToad, you agree to the terms outlined on this page. We encourage you to read this document carefully to understand your relationship with our platform.
 </p>
 </section>

 <section>
 <h2 className="text-h3 font-medium text-white mb-4 tracking-tight">3. Contact Us</h2>
 <p className="font-medium tracking-tight">
 If you have any questions regarding this {title.toLowerCase()}, please contact our support team at support@neontoad.com.
 </p>
 </section>
 </div>
 </div>
 </motion.div>
 </div>
 );
};

export default Support;
