import { useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Dumbbell, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateFitnessResults, type UserData } from '@/lib/fitness-utils';
import Footer from '@/components/Footer';

export default function Recommendations() {
  const [formData, setFormData] = useState<UserData>({ age: 25, gender: 'male', heightCm: 175, weightKg: 70, heartRate: 85, bodyTemp: 37, duration: 30 });
  const [results, setResults] = useState<ReturnType<typeof calculateFitnessResults> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setResults(calculateFitnessResults(formData));
      setLoading(false);
    }, 600);
  };

  const update = (field: keyof UserData, value: number | string) => setFormData((p) => ({ ...p, [field]: value }));
  const inputClass = "w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">
            Personalized <span className="gradient-text">Recommendations</span>
          </h1>
          <p className="text-muted-foreground mb-8">Get diet and exercise plans tailored to your body and goals.</p>
        </motion.div>

        {/* Quick input */}
        {!results && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 max-w-2xl mx-auto mb-8">
            <h2 className="font-heading font-semibold mb-4">Enter Your Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Age', field: 'age' as const, val: formData.age },
                { label: 'Height (cm)', field: 'heightCm' as const, val: formData.heightCm },
                { label: 'Weight (kg)', field: 'weightKg' as const, val: formData.weightKg },
                { label: 'Heart Rate', field: 'heartRate' as const, val: formData.heartRate },
                { label: 'Body Temp (°C)', field: 'bodyTemp' as const, val: formData.bodyTemp },
                { label: 'Duration (min)', field: 'duration' as const, val: formData.duration },
              ].map((f) => (
                <div key={f.field}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <input type="number" step={f.field === 'bodyTemp' ? 0.1 : 1} value={f.val} onChange={(e) => update(f.field, +e.target.value)} className={inputClass} />
                </div>
              ))}
            </div>
            <div className="flex gap-4 items-center mb-4">
              <label className="text-xs text-muted-foreground">Gender:</label>
              {['male', 'female'].map((g) => (
                <button key={g} onClick={() => update('gender', g)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.gender === g ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'}`}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full rounded-lg font-semibold" style={{ background: 'var(--gradient-primary)' }}>
              {loading ? 'Generating...' : <><Zap className="w-4 h-4 mr-2" /> Generate Recommendations</>}
            </Button>
          </motion.div>
        )}

        {results && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="glass-card rounded-xl px-4 py-2 inline-flex items-center gap-2 text-sm">
                BMI: <span className="font-bold text-primary">{results.bmi}</span> ({results.bmiCategory}) •
                Calories: <span className="font-bold text-accent">{results.caloriesBurned} kcal</span> •
                Intensity: <span className="font-bold">{results.activityIntensity}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setResults(null)} className="border-border/50">
                Recalculate
              </Button>
            </div>

            {/* Diet */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
                <Utensils className="w-6 h-6 text-chart-green" /> Diet Plan
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.recommendations.diet.map((d) => (
                  <div key={d.meal} className="glass-card-hover rounded-2xl p-5">
                    <div className="text-3xl mb-3">{d.icon}</div>
                    <h3 className="font-heading font-semibold mb-1">{d.meal}</h3>
                    <p className="text-xs text-primary font-medium mb-3">{d.calories} kcal</p>
                    <ul className="space-y-1.5">
                      {d.items.map((item) => (
                        <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-chart-green mt-0.5">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Exercise */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-chart-orange" /> Exercise Plan
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.recommendations.exercise.map((e) => (
                  <div key={e.name} className="glass-card-hover rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{e.icon}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        e.intensity === 'Low' ? 'bg-chart-green/20 text-chart-green' :
                        e.intensity === 'Moderate' ? 'bg-chart-blue/20 text-chart-blue' :
                        e.intensity === 'High' ? 'bg-chart-orange/20 text-chart-orange' :
                        'bg-chart-pink/20 text-chart-pink'
                      }`}>{e.intensity}</span>
                    </div>
                    <h3 className="font-heading font-semibold mb-1">{e.name}</h3>
                    <p className="text-sm text-muted-foreground">{e.duration}</p>
                    <p className="text-xs text-accent font-medium mt-2">🔥 {e.caloriesBurn} kcal</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="glass-card rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-chart-blue mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                These recommendations are generated by our AI algorithms based on your health data. Always consult a healthcare professional before starting any new diet or exercise program.
              </p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
