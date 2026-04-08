import { Activity, Github, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-secondary/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold gradient-text">FitPulse</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your personal AI-powered fitness companion. Track workouts, get recommendations, and achieve your health goals.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Planner', path: '/planner' },
                { label: 'Admin', path: '/admin' },
                { label: 'Recommendations', path: '/recommendations' },
                { label: 'Chatbot', path: '/chatbot' },
              ].map((link) => (
                <Link key={link.path} to={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">About</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Built with React, TypeScript, and ML-inspired fitness algorithms. Inspired by the Python Personal Fitness Tracker project.
            </p>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-accent" /> by FitPulse
          </p>
          <a href="https://github.com/ruchikakengal/Implementation-of-Personal-Fitness-Tracker-using-Python" target="_blank" rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
            <Github className="w-3 h-3" /> Original Project
          </a>
        </div>
      </div>
    </footer>
  );
}
