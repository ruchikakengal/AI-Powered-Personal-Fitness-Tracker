import { signInAnonymously } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

// Key gamification to an authenticated Firebase user.
// We auto-sign in anonymously so Firestore security rules can require auth.
export async function getGamificationUserId(): Promise<string> {
  const auth = getFirebaseAuth();
  if (auth.currentUser?.uid) return auth.currentUser.uid;

  const result = await signInAnonymously(auth);
  return result.user.uid;
}

