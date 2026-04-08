// Fitness calculation utilities inspired by the Python fitness tracker project

export interface UserData {
  age: number;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  heartRate: number;
  bodyTemp: number;
  duration: number; // workout duration in minutes
}

export interface FitnessResults {
  bmi: number;
  bmiCategory: string;
  caloriesBurned: number;
  activityIntensity: 'Low' | 'Moderate' | 'High' | 'Very High';
  heartRateZone: string;
  recommendations: {
    diet: DietRecommendation[];
    exercise: ExerciseRecommendation[];
  };
}

export interface DietRecommendation {
  meal: string;
  items: string[];
  calories: number;
  icon: string;
}

export interface ExerciseRecommendation {
  name: string;
  duration: string;
  caloriesBurn: number;
  intensity: string;
  icon: string;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// Calorie prediction model (approximation of the ML model from the Python project)
// Based on duration, heart rate, body temp, age, BMI, gender
export function predictCalories(data: UserData): number {
  const bmi = calculateBMI(data.weightKg, data.heightCm);
  const genderFactor = data.gender === 'male' ? 1.1 : 0.9;

  // Regression-like formula calibrated to typical fitness data
  const calories =
    data.duration * 3.5 +
    (data.heartRate - 60) * 0.8 +
    (data.bodyTemp - 36) * 50 +
    bmi * 1.2 -
    data.age * 0.3 +
    genderFactor * 20;

  return Math.max(0, Math.round(calories));
}

export function getActivityIntensity(heartRate: number, age: number): 'Low' | 'Moderate' | 'High' | 'Very High' {
  const maxHR = 220 - age;
  const percentage = (heartRate / maxHR) * 100;
  if (percentage < 50) return 'Low';
  if (percentage < 70) return 'Moderate';
  if (percentage < 85) return 'High';
  return 'Very High';
}

export function getHeartRateZone(heartRate: number, age: number): string {
  const maxHR = 220 - age;
  const pct = (heartRate / maxHR) * 100;
  if (pct < 50) return 'Rest / Very Light';
  if (pct < 60) return 'Light (Fat Burn)';
  if (pct < 70) return 'Moderate (Aerobic)';
  if (pct < 80) return 'Hard (Cardio)';
  if (pct < 90) return 'Very Hard (Anaerobic)';
  return 'Maximum Effort';
}

export function getDietRecommendations(bmi: number, caloriesBurned: number): DietRecommendation[] {
  const isUnderweight = bmi < 18.5;
  const isOverweight = bmi >= 25;

  if (isUnderweight) {
    return [
      { meal: 'Breakfast', items: ['Oatmeal with nuts & banana', 'Whole milk smoothie', '2 boiled eggs'], calories: 550, icon: '🌅' },
      { meal: 'Lunch', items: ['Grilled chicken breast', 'Brown rice', 'Avocado salad'], calories: 700, icon: '☀️' },
      { meal: 'Snack', items: ['Protein shake', 'Trail mix', 'Greek yogurt'], calories: 400, icon: '🥤' },
      { meal: 'Dinner', items: ['Salmon with quinoa', 'Steamed vegetables', 'Sweet potato'], calories: 650, icon: '🌙' },
    ];
  }

  if (isOverweight) {
    return [
      { meal: 'Breakfast', items: ['Green smoothie', 'Whole grain toast', 'Egg whites'], calories: 300, icon: '🌅' },
      { meal: 'Lunch', items: ['Grilled fish', 'Mixed greens salad', 'Lemon dressing'], calories: 400, icon: '☀️' },
      { meal: 'Snack', items: ['Apple slices', 'Almonds (10 pcs)', 'Green tea'], calories: 150, icon: '🥤' },
      { meal: 'Dinner', items: ['Chicken soup', 'Steamed broccoli', 'Small portion brown rice'], calories: 350, icon: '🌙' },
    ];
  }

  return [
    { meal: 'Breakfast', items: ['Whole grain cereal', 'Fresh fruit', 'Low-fat milk'], calories: 400, icon: '🌅' },
    { meal: 'Lunch', items: ['Turkey wrap', 'Mixed vegetables', 'Hummus'], calories: 500, icon: '☀️' },
    { meal: 'Snack', items: ['Protein bar', 'Banana', 'Water'], calories: 250, icon: '🥤' },
    { meal: 'Dinner', items: ['Lean steak', 'Roasted vegetables', 'Quinoa'], calories: 550, icon: '🌙' },
  ];
}

export function getExerciseRecommendations(bmi: number, intensity: string): ExerciseRecommendation[] {
  const isOverweight = bmi >= 25;
  const isUnderweight = bmi < 18.5;

  if (isOverweight) {
    return [
      { name: 'Brisk Walking', duration: '30-45 min', caloriesBurn: 200, intensity: 'Low', icon: '🚶' },
      { name: 'Swimming', duration: '30 min', caloriesBurn: 300, intensity: 'Moderate', icon: '🏊' },
      { name: 'Cycling', duration: '30 min', caloriesBurn: 280, intensity: 'Moderate', icon: '🚴' },
      { name: 'Yoga', duration: '45 min', caloriesBurn: 180, intensity: 'Low', icon: '🧘' },
      { name: 'Elliptical', duration: '25 min', caloriesBurn: 250, intensity: 'Moderate', icon: '🏋️' },
    ];
  }

  if (isUnderweight) {
    return [
      { name: 'Weight Training', duration: '40 min', caloriesBurn: 250, intensity: 'Moderate', icon: '🏋️' },
      { name: 'Push-ups & Squats', duration: '20 min', caloriesBurn: 150, intensity: 'Moderate', icon: '💪' },
      { name: 'Light Jogging', duration: '20 min', caloriesBurn: 180, intensity: 'Low', icon: '🏃' },
      { name: 'Stretching', duration: '15 min', caloriesBurn: 60, intensity: 'Low', icon: '🤸' },
      { name: 'Resistance Bands', duration: '25 min', caloriesBurn: 160, intensity: 'Low', icon: '🎯' },
    ];
  }

  return [
    { name: 'Running', duration: '30 min', caloriesBurn: 350, intensity: 'High', icon: '🏃' },
    { name: 'HIIT Workout', duration: '25 min', caloriesBurn: 400, intensity: 'Very High', icon: '⚡' },
    { name: 'Weight Training', duration: '45 min', caloriesBurn: 300, intensity: 'Moderate', icon: '🏋️' },
    { name: 'Jump Rope', duration: '15 min', caloriesBurn: 200, intensity: 'High', icon: '🤾' },
    { name: 'Boxing', duration: '30 min', caloriesBurn: 380, intensity: 'High', icon: '🥊' },
  ];
}

export function calculateFitnessResults(data: UserData): FitnessResults {
  const bmi = calculateBMI(data.weightKg, data.heightCm);
  const bmiCategory = getBMICategory(bmi);
  const caloriesBurned = predictCalories(data);
  const activityIntensity = getActivityIntensity(data.heartRate, data.age);
  const heartRateZone = getHeartRateZone(data.heartRate, data.age);

  return {
    bmi,
    bmiCategory,
    caloriesBurned,
    activityIntensity,
    heartRateZone,
    recommendations: {
      diet: getDietRecommendations(bmi, caloriesBurned),
      exercise: getExerciseRecommendations(bmi, activityIntensity),
    },
  };
}

// Generate mock weekly data for charts
export function generateWeeklyData() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day) => ({
    day,
    calories: Math.round(200 + Math.random() * 400),
    steps: Math.round(3000 + Math.random() * 8000),
    heartRate: Math.round(65 + Math.random() * 40),
    duration: Math.round(15 + Math.random() * 60),
  }));
}

// Chatbot responses
export function getChatbotResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('bmi') || lower.includes('body mass')) {
    return "**BMI (Body Mass Index)** is calculated as weight(kg) / height(m)². Here's how to interpret it:\n\n- **< 18.5**: Underweight\n- **18.5 - 24.9**: Normal weight\n- **25 - 29.9**: Overweight\n- **30+**: Obese\n\nGo to the **Dashboard** to calculate yours!";
  }

  if (lower.includes('calorie') || lower.includes('burn')) {
    return "Calories burned depend on your **workout duration, heart rate, body temperature, age, and BMI**. Our prediction model analyzes these factors to give you an accurate estimate. Try entering your data in the **Dashboard**!";
  }

  if (lower.includes('diet') || lower.includes('food') || lower.includes('eat') || lower.includes('nutrition')) {
    return "Great question about diet! 🥗 Our system provides **personalized meal recommendations** based on your BMI. Visit the **Recommendations** page after entering your health data to see your customized diet plan.";
  }

  if (lower.includes('exercise') || lower.includes('workout') || lower.includes('training')) {
    return "For exercise recommendations, we consider your **BMI and activity intensity** to suggest the best workouts. Check the **Recommendations** page for personalized exercise plans! 💪";
  }

  if (lower.includes('heart rate') || lower.includes('hr') || lower.includes('pulse')) {
    return "Your **heart rate zone** helps determine workout intensity:\n\n- 🟢 **50-60%** max HR: Fat burning zone\n- 🟡 **60-70%**: Aerobic zone\n- 🟠 **70-80%**: Cardio zone\n- 🔴 **80-90%**: Anaerobic zone\n\nMax HR ≈ 220 - your age.";
  }

  if (lower.includes('how') && (lower.includes('use') || lower.includes('work') || lower.includes('start'))) {
    return "Here's how to get started! 🚀\n\n1. Go to the **Dashboard**\n2. Enter your health data (age, weight, height, etc.)\n3. Click **Analyze** to get your results\n4. Check your **BMI, calories burned, and activity intensity**\n5. Visit **Recommendations** for personalized diet & exercise plans";
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hey there! 👋 I'm your fitness assistant. I can help you with:\n\n- 📊 Understanding your **BMI & health metrics**\n- 🔥 **Calorie burn** predictions\n- 🥗 **Diet** recommendations\n- 💪 **Exercise** suggestions\n- ❓ **How to use** this platform\n\nWhat would you like to know?";
  }

  if (lower.includes('weight') && lower.includes('los')) {
    return "For weight loss, focus on:\n\n1. **Caloric deficit** — burn more than you eat\n2. **Cardio exercises** — running, cycling, swimming\n3. **Strength training** — builds muscle, boosts metabolism\n4. **Balanced diet** — lean proteins, vegetables, whole grains\n5. **Consistency** — aim for 3-5 workouts per week\n\nCheck your personalized plan in **Recommendations**!";
  }

  if (lower.includes('muscle') || lower.includes('gain') || lower.includes('bulk')) {
    return "To build muscle:\n\n1. **Caloric surplus** — eat 300-500 extra calories\n2. **Protein intake** — 1.6-2.2g per kg of body weight\n3. **Progressive overload** — increase weights gradually\n4. **Rest & recovery** — 7-9 hours of sleep\n5. **Compound exercises** — squats, deadlifts, bench press";
  }

  return "I'm not sure about that, but I can help you with **BMI calculations, calorie predictions, diet plans, exercise recommendations**, and **how to use the platform**. Try asking about any of these topics! 😊";
}
