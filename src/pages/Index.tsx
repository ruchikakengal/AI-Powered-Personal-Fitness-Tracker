import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, BarChart3, Brain, Utensils, Zap, Heart, TrendingUp, Dumbbell, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const features = [
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Track calories, BMI, heart rate zones, and activity intensity with real-time charts.' },
  { icon: Brain, title: 'ML Predictions', desc: 'AI-powered calorie burn predictions based on your personal health metrics.' },
  { icon: Utensils, title: 'Diet Plans', desc: 'Personalized meal recommendations based on your BMI and fitness goals.' },
  { icon: Dumbbell, title: 'Exercise Guide', desc: 'Custom workout plans tailored to your body type and activity level.' },
  { icon: MessageCircle, title: 'Smart Chatbot', desc: 'Get instant answers to fitness questions and platform guidance.' },
  { icon: TrendingUp, title: 'Progress Tracking', desc: 'Visualize your weekly progress with interactive charts and insights.' },
];

const stats = [
  { value: '99%', label: 'Prediction Accuracy' },
  { value: '500+', label: 'Exercise Plans' },
  { value: '24/7', label: 'AI Support' },
  { value: '50+', label: 'Health Metrics' },
];

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-[100px] animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-accent/10 blur-[120px]" style={{ animationDelay: '3s' }} />

        <div className="container mx-auto px-4 pt-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-8 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-accent" />
                AI-Powered Fitness Intelligence
              </div>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
                Your Personal
                <br />
                <span className="gradient-text">Fitness Tracker</span>
              </h1>

              <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                Track calories, predict fitness outcomes, and get personalized diet & exercise recommendations — all powered by intelligent algorithms.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="rounded-full px-8 text-base font-semibold" style={{ background: 'var(--gradient-primary)' }}>
                  <Link to="/dashboard">
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base border-border/50 hover:bg-secondary">
                  <Link to="/chatbot">Talk to AI Assistant</Link>
                </Button>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
            >
              {stats.map((s) => (
                <div key={s.label} className="glass-card rounded-xl p-4 text-center">
                  <div className="text-2xl font-heading font-bold gradient-text">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding" id="features">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to
              <span className="gradient-text"> Stay Fit</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete fitness ecosystem powered by machine learning and smart analytics.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover rounded-2xl p-6"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--gradient-primary)' }}>
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-secondary/20">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Enter Your Data', desc: 'Input your age, weight, height, heart rate, and workout details.', icon: Activity },
              { step: '02', title: 'Get AI Analysis', desc: 'Our algorithms calculate your BMI, predict calories burned, and assess intensity.', icon: Brain },
              { step: '03', title: 'Follow Your Plan', desc: 'Receive personalized diet and exercise recommendations tailored to you.', icon: Heart },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-5xl font-heading font-bold gradient-text mb-4">{item.step}</div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary/10">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0" style={{ background: 'var(--gradient-glow)' }} />
            <div className="relative z-10">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
                Ready to Transform Your <span className="gradient-text">Fitness Journey</span>?
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Start tracking your progress today with AI-powered insights and personalized recommendations.
              </p>
              <Button asChild size="lg" className="rounded-full px-8 text-base font-semibold" style={{ background: 'var(--gradient-primary)' }}>
                <Link to="/dashboard">
                  Start Now <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="section-padding bg-secondary/20" id="contact">
        <div className="container mx-auto max-w-lg text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">
            <span className="gradient-text">Get In Touch</span>
          </h2>
          <p className="text-muted-foreground mb-8">Have feedback or questions? We'd love to hear from you.</p>
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <input placeholder="Your Name" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <input placeholder="Email Address" type="email" className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <textarea placeholder="Your Message" rows={4} className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            <Button className="w-full rounded-lg font-semibold" style={{ background: 'var(--gradient-primary)' }}>
              <Mail className="w-4 h-4 mr-2" /> Send Message
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
